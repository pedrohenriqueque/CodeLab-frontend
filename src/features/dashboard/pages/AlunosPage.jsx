import { Fragment, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

import { getAtividades } from '../../atividades/api';
import { getSubmissoes } from '../../submissoes/api';
import { getAlunosTurma, removerAlunoTurma } from '../../turmas/api';
import { useTurmaContext } from '../../turmas/context/TurmaContext';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';

const MAX_VISIBLE_ACTIVITIES = 3;

function getInitials(nome) {
  const partes = (nome || '').trim().split(/\s+/).filter(Boolean);
  return partes.length > 1
    ? `${partes[0][0]}${partes.at(-1)[0]}`.toUpperCase()
    : (partes[0] || '?').slice(0, 2).toUpperCase();
}

function normalizeMatricula(matricula) {
  return String(matricula || '').trim().toLocaleUpperCase('pt-BR');
}

function buildSubmissionIndex(submissoes, atividadeIds) {
  const index = new Map();

  for (const submissao of submissoes) {
    const matricula = normalizeMatricula(submissao.alunoMatricula);
    const atividadeUuid = submissao.atividadeUuid;
    const funcaoUuid = submissao.funcaoUuid;
    if (!matricula || !atividadeIds.has(atividadeUuid) || !funcaoUuid) continue;

    if (!index.has(matricula)) index.set(matricula, new Map());
    const atividadesDoAluno = index.get(matricula);
    if (!atividadesDoAluno.has(atividadeUuid)) {
      atividadesDoAluno.set(atividadeUuid, { funcoesEnviadas: new Set(), melhoresNotas: new Map() });
    }

    const progresso = atividadesDoAluno.get(atividadeUuid);
    // A existência de uma tentativa conta como envio, independentemente do resultado ou da nota.
    progresso.funcoesEnviadas.add(funcaoUuid);

    if (submissao.nota !== null && submissao.nota !== undefined) {
      const nota = Number(submissao.nota);
      const melhorNota = progresso.melhoresNotas.get(funcaoUuid);
      if (Number.isFinite(nota) && (melhorNota === undefined || nota > melhorNota)) {
        progresso.melhoresNotas.set(funcaoUuid, nota);
      }
    }
  }

  return index;
}

function getProgressoAtividades(aluno, atividades, progressoPorAluno) {
  const tentativasPorAtividade = progressoPorAluno.get(normalizeMatricula(aluno.matricula));

  return atividades.map((atividade) => {
    const funcoes = atividade.funcoes || [];
    const progresso = tentativasPorAtividade?.get(atividade.uuid);
    const funcoesEnviadas = funcoes.filter((funcao) => progresso?.funcoesEnviadas.has(funcao.uuid)).length;
    const totalFuncoes = funcoes.length;
    const concluida = totalFuncoes > 0 && funcoesEnviadas === totalFuncoes;
    const temNotaDeTodasAsFuncoes = totalFuncoes > 0
      && funcoes.every((funcao) => progresso?.melhoresNotas.has(funcao.uuid));
    const nota = temNotaDeTodasAsFuncoes
      ? funcoes.reduce((soma, funcao) => soma + progresso.melhoresNotas.get(funcao.uuid), 0)
      : null;

    return {
      uuid: atividade.uuid,
      titulo: atividade.titulo,
      totalFuncoes,
      funcoesEnviadas,
      concluida,
      nota,
    };
  });
}

function formatNota(nota) {
  if (nota === null || nota === undefined) return 'indisponível';
  return Number(nota).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

function MetricCard({ icon, value, label, background, color, loading }) {
  return (
    <Card
      variant="outlined"
      sx={{
        p: 2.5,
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        borderRadius: 3.5,
        borderColor: '#E5ECF7',
        bgcolor: 'rgba(255,255,255,0.96)',
        boxShadow: '0 5px 18px rgba(35, 67, 126, 0.07)',
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: background, color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          {icon}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          {loading
            ? <Skeleton width={48} height={34} />
            : <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.05, color: '#111B59' }}>{value}</Typography>}
          <Typography variant="body2" sx={{ color: '#536BB4', mt: 0.35 }}>{label}</Typography>
        </Box>
      </Stack>
    </Card>
  );
}

const GROUP_CONFIG = {
  completed: {
    titulo: 'Atividades concluídas',
    subtitulo: 'Todas as funções foram enviadas.',
    vazio: 'Nenhuma atividade concluída.',
    icon: <CheckCircleIcon />,
    iconBg: '#E4FAEF',
    iconColor: '#08B873',
    badgeLabel: 'Concluída',
    badgeBg: '#E4FAEF',
    badgeColor: '#08B873',
  },
  in_progress: {
    titulo: 'Em progresso',
    subtitulo: 'Funções parcialmente enviadas.',
    vazio: 'Nenhuma atividade em progresso.',
    icon: <PlayArrowRoundedIcon />,
    iconBg: '#EFF8FF',
    iconColor: '#1570EF',
    badgeLabel: 'Em progresso',
    badgeBg: '#E8F2FF',
    badgeColor: '#0756D8',
  },
  not_started: {
    titulo: 'Não iniciadas',
    subtitulo: 'Nenhuma função enviada ainda.',
    vazio: 'Nenhuma atividade não iniciada.',
    icon: <AccessTimeOutlinedIcon />,
    iconBg: '#F2F4F7',
    iconColor: '#64748B',
    badgeLabel: 'Não iniciada',
    badgeBg: '#F1F4F8',
    badgeColor: '#64748B',
  },
};

function ActivityGroupCard({ kind, activities, showAll, onToggleAll, onOpenActivity }) {
  const config = GROUP_CONFIG[kind] || GROUP_CONFIG.not_started;
  const isCompleted = kind === 'completed';
  const visiveis = showAll ? activities : activities.slice(0, MAX_VISIBLE_ACTIVITIES);

  return (
    <Card
      variant="outlined"
      sx={{
        p: { xs: 2, sm: 2.25, md: 2.5 },
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        borderColor: '#E1EAF8',
        bgcolor: '#FFFFFF',
        boxShadow: '0 2px 10px rgba(17, 27, 89, 0.04)',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        '&:hover': {
          borderColor: '#CADCF5',
          boxShadow: '0 4px 16px rgba(17, 27, 89, 0.08)',
        },
      }}
    >
      <Stack
        direction="row"
        spacing={1.25}
        alignItems="center"
        justifyContent="space-between"
        sx={{ pb: 1.5, mb: 1, borderBottom: '1px solid #E8EEF8' }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              bgcolor: config.iconBg,
              color: config.iconColor,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            {config.icon}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#111B59', lineHeight: 1.2 }} noWrap>
              {config.titulo}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6478B4', mt: 0.25, fontSize: '0.8125rem' }} noWrap>
              {config.subtitulo}
            </Typography>
          </Box>
        </Stack>
        <Chip
          label={`${activities.length}`}
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: '0.8rem',
            height: 26,
            minWidth: 28,
            px: 0.75,
            bgcolor: config.badgeBg,
            color: config.badgeColor,
            borderRadius: '13px',
            flexShrink: 0,
          }}
        />
      </Stack>

      {visiveis.length === 0 ? (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 120,
            my: 1,
            p: 2,
            borderRadius: 2.5,
            bgcolor: '#FAFBFC',
            border: '1px dashed #E2E8F0',
          }}
        >
          <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 500, textAlign: 'center' }}>
            {config.vazio}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {visiveis.map((atividade, index) => (
            <Box
              key={atividade.uuid}
              sx={{
                minHeight: 52,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
                px: 1,
                py: 0.75,
                borderRadius: 2,
                transition: 'background-color 0.15s ease',
                '&:hover': { bgcolor: '#F8FAFD' },
                borderBottom: index < visiveis.length - 1 ? '1px solid #EDF2F9' : 'none',
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1, pr: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#111B59' }} noWrap>
                  {atividade.titulo}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6478B4', display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                  <span>{atividade.funcoesEnviadas}/{atividade.totalFuncoes} funções</span>
                  {isCompleted && atividade.nota !== null && atividade.nota !== undefined && (
                    <>
                      <span style={{ opacity: 0.5 }}>•</span>
                      <strong style={{ color: '#08B873', fontWeight: 700 }}>Nota {formatNota(atividade.nota)}</strong>
                    </>
                  )}
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexShrink: 0 }}>
                <Chip
                  size="small"
                  label={config.badgeLabel}
                  sx={{
                    height: 24,
                    fontSize: '0.72rem',
                    px: 0.5,
                    color: config.badgeColor,
                    bgcolor: config.badgeBg,
                    fontWeight: 600,
                    borderRadius: '6px',
                  }}
                />
                <Tooltip title={`Abrir atividade ${atividade.titulo}`}>
                  <IconButton
                    size="small"
                    onClick={() => onOpenActivity(atividade.uuid)}
                    aria-label={`Abrir atividade ${atividade.titulo}`}
                    sx={{
                      color: '#2563EB',
                      bgcolor: '#EFF6FF',
                      '&:hover': { bgcolor: '#DBEAFE', color: '#1D4ED8' },
                      width: 30,
                      height: 30,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <KeyboardArrowRightIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          ))}
        </Box>
      )}

      {activities.length > MAX_VISIBLE_ACTIVITIES && (
        <Box sx={{ mt: 'auto', pt: 1.5 }}>
          <Button
            fullWidth
            size="small"
            onClick={onToggleAll}
            sx={{
              py: 0.8,
              borderRadius: 2,
              bgcolor: '#EEF0FF',
              color: '#174CF5',
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': { bgcolor: '#E3E7FF' },
            }}
          >
            {showAll ? 'Mostrar menos' : `Ver todas as ${activities.length}`}
            {showAll ? <KeyboardArrowDownIcon sx={{ ml: 0.5, transform: 'rotate(180deg)' }} /> : <KeyboardArrowRightIcon sx={{ ml: 0.5 }} />}
          </Button>
        </Box>
      )}
    </Card>
  );
}

export default function AlunosPage() {
  const { turmaAtiva } = useTurmaContext();
  const { showSuccess, showError } = useSnackbar();
  const navigate = useNavigate();
  const [alunos, setAlunos] = useState([]);
  const [atividades, setAtividades] = useState([]);
  const [submissoes, setSubmissoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [alunosExpandidos, setAlunosExpandidos] = useState(() => new Set());
  const [listasExpandidas, setListasExpandidas] = useState({});
  const [alunoParaRemover, setAlunoParaRemover] = useState(null);
  const [removendo, setRemovendo] = useState(false);

  useEffect(() => {
    let ativo = true;
    const turmaUuid = turmaAtiva?.uuid;

    async function carregarDados() {
      setError(null);
      setLoading(true);
      setAlunos([]);
      setAtividades([]);
      setSubmissoes([]);
      setAlunosExpandidos(new Set());
      setListasExpandidas({});

      if (!turmaUuid) {
        if (ativo) setLoading(false);
        return;
      }

      try {
        const [dadosAlunos, dadosAtividades, dadosSubmissoes] = await Promise.all([
          getAlunosTurma(turmaUuid),
          getAtividades(turmaUuid),
          getSubmissoes(),
        ]);
        if (!ativo) return;
        setAlunos(Array.isArray(dadosAlunos) ? dadosAlunos : []);
        setAtividades(Array.isArray(dadosAtividades)
          ? dadosAtividades.filter((atividade) => atividade.status !== 'RASCUNHO')
          : []);
        setSubmissoes(Array.isArray(dadosSubmissoes) ? dadosSubmissoes : []);
      } catch (requestError) {
        if (ativo) setError(requestError.response?.data?.erro || 'Não foi possível carregar os dados da turma.');
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregarDados();
    return () => { ativo = false; };
  }, [turmaAtiva?.uuid]);

  const atividadeIds = useMemo(() => new Set(atividades.map((atividade) => atividade.uuid)), [atividades]);
  const progressoPorAluno = useMemo(
    () => buildSubmissionIndex(submissoes, atividadeIds),
    [submissoes, atividadeIds],
  );
  const alunosComProgresso = useMemo(() => alunos.map((aluno) => ({
    ...aluno,
    progressoAtividades: getProgressoAtividades(aluno, atividades, progressoPorAluno),
  })), [alunos, atividades, progressoPorAluno]);

  const alunosFiltrados = useMemo(() => {
    const termo = searchTerm.trim().toLocaleLowerCase('pt-BR');
    if (!termo) return alunosComProgresso;
    return alunosComProgresso.filter((aluno) => (
      aluno.nome.toLocaleLowerCase('pt-BR').includes(termo)
      || aluno.matricula.toLocaleLowerCase('pt-BR').includes(termo)
      || aluno.email.toLocaleLowerCase('pt-BR').includes(termo)
    ));
  }, [alunosComProgresso, searchTerm]);

  const totalEnvios = alunos.reduce((total, aluno) => total + (Number(aluno.atividadesEnviadas) || 0), 0);
  const totalAtividadesPossiveis = alunos.reduce((total, aluno) => total + (Number(aluno.totalAtividades) || 0), 0);
  const taxaDeEntrega = totalAtividadesPossiveis > 0
    ? `${Math.round((totalEnvios / totalAtividadesPossiveis) * 100)}%`
    : '—';
  const alunosEmAndamento = alunos.filter((aluno) => (
    Number(aluno.atividadesEnviadas) > 0
    && Number(aluno.atividadesEnviadas) < Number(aluno.totalAtividades)
  )).length;

  const alternarAluno = (alunoUuid) => {
    setAlunosExpandidos((atuais) => {
      const novos = new Set(atuais);
      if (novos.has(alunoUuid)) novos.delete(alunoUuid);
      else novos.add(alunoUuid);
      return novos;
    });
  };

  const alternarLista = (alunoUuid, tipo) => {
    const chave = `${alunoUuid}:${tipo}`;
    setListasExpandidas((atuais) => ({ ...atuais, [chave]: !atuais[chave] }));
  };

  const confirmarRemocao = async () => {
    if (!turmaAtiva?.uuid || !alunoParaRemover) return;
    setRemovendo(true);
    try {
      await removerAlunoTurma(turmaAtiva.uuid, alunoParaRemover.uuid);
      setAlunos((atuais) => atuais.filter((aluno) => aluno.uuid !== alunoParaRemover.uuid));
      setAlunosExpandidos((atuais) => {
        const novos = new Set(atuais);
        novos.delete(alunoParaRemover.uuid);
        return novos;
      });
      showSuccess('Aluno removido da turma.');
      setAlunoParaRemover(null);
    } catch (requestError) {
      showError(requestError.response?.data?.erro || 'Não foi possível remover o aluno da turma.');
    } finally {
      setRemovendo(false);
    }
  };

  if (!turmaAtiva) {
    return <Alert severity="info">Selecione uma turma para consultar os alunos matriculados.</Alert>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
      <Grid container spacing={{ xs: 2, md: 2.5 }} sx={{ width: '100%' }} alignItems="stretch">
        <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex' }}>
          <MetricCard
            icon={<PeopleAltOutlinedIcon sx={{ fontSize: 31 }} />}
            value={alunos.length}
            label="Total de alunos"
            background="#F0EEFF"
            color="#3825F5"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex' }}>
          <MetricCard
            icon={<CheckCircleIcon sx={{ fontSize: 31 }} />}
            value={taxaDeEntrega}
            label="Taxa de entrega"
            background="#E5FBF1"
            color="#09B878"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex' }}>
          <MetricCard
            icon={<PlayArrowRoundedIcon sx={{ fontSize: 31 }} />}
            value={alunosEmAndamento}
            label="Alunos com atividades em andamento"
            background="#E8F3FF"
            color="#0671F9"
            loading={loading}
          />
        </Grid>
      </Grid>

      <Card variant="outlined" sx={{ overflow: 'hidden', borderRadius: 3.5, borderColor: '#E2EAF6', boxShadow: '0 6px 22px rgba(35, 67, 126, 0.06)' }}>
        <Box sx={{ p: 2.25, borderBottom: '1px solid #E5ECF6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#111B59' }}>Lista da turma</Typography>
          <TextField
            size="small"
            placeholder="Buscar por aluno ou matrícula..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            sx={{ width: { xs: '100%', sm: 360 }, '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: '#FFFFFF' } }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#6478B4', fontSize: 22 }} /></InputAdornment> } }}
          />
        </Box>

        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ p: 2.5 }}>{[1, 2, 3].map((item) => <Skeleton key={item} variant="rounded" height={62} sx={{ mb: 1 }} />)}</Box>
        ) : alunosFiltrados.length === 0 ? (
          <Alert severity="info" sx={{ m: 2.5 }}>
            {alunos.length === 0 ? 'Nenhum aluno está matriculado nesta turma.' : 'Nenhum aluno encontrado.'}
          </Alert>
        ) : (
          <TableContainer>
            <Table aria-label="Alunos da turma" sx={{ minWidth: 820 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F5F8FC' }}>
                  <TableCell sx={{ width: '39%', py: 1.5, color: '#45599B', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Aluno</TableCell>
                  <TableCell sx={{ width: '18%', py: 1.5, color: '#45599B', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Matrícula</TableCell>
                  <TableCell sx={{ width: '28%', py: 1.5, color: '#45599B', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Atividades enviadas</TableCell>
                  <TableCell align="right" sx={{ width: '15%', py: 1.5, color: '#45599B', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alunosFiltrados.map((aluno) => {
                  const expandido = alunosExpandidos.has(aluno.uuid);
                  const progresso = aluno.progressoAtividades || [];
                  const concluidas = progresso.filter((atividade) => atividade.concluida);
                  const emProgresso = progresso.filter((atividade) => !atividade.concluida && (atividade.funcoesEnviadas || 0) > 0);
                  const naoIniciadas = progresso.filter((atividade) => !atividade.concluida && (atividade.funcoesEnviadas || 0) === 0);

                  return (
                    <Fragment key={aluno.uuid}>
                      <TableRow hover selected={expandido}>
                        <TableCell sx={{ py: 1.1 }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ width: 48, height: 48, bgcolor: '#3924F5', background: 'linear-gradient(145deg, #5637FF 0%, #3216E8 100%)', fontWeight: 700 }}>{getInitials(aluno.nome)}</Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body1" sx={{ fontWeight: 700, color: '#111B59' }}>{aluno.nome}</Typography>
                              <Typography variant="body2" sx={{ color: '#6478B4' }}>{aluno.email}</Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#6478B4', fontFamily: 'monospace' }}>{aluno.matricula}</Typography>
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() => alternarAluno(aluno.uuid)}
                            endIcon={expandido ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                            aria-expanded={expandido}
                            aria-controls={`progresso-${aluno.uuid}`}
                            sx={{ p: 0, minWidth: 0, color: '#075CF5', fontSize: '1rem', fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
                          >
                            {aluno.atividadesEnviadas} / {aluno.totalAtividades} atividades
                          </Button>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Remover da turma">
                            <IconButton color="error" onClick={() => setAlunoParaRemover(aluno)} aria-label={`Remover ${aluno.nome} da turma`}>
                              <PersonRemoveOutlinedIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                      {expandido && (
                        <TableRow id={`progresso-${aluno.uuid}`}>
                          <TableCell
                            colSpan={4}
                            sx={{
                              p: { xs: 2, sm: 2.5, md: 3 },
                              bgcolor: '#F8FAFD',
                              borderBottom: '1px solid #DDE8F8',
                            }}
                          >
                            <Grid container spacing={{ xs: 2, md: 2.5 }} sx={{ width: '100%' }} alignItems="stretch">
                              <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex' }}>
                                <ActivityGroupCard
                                  kind="completed"
                                  activities={concluidas}
                                  showAll={Boolean(listasExpandidas[`${aluno.uuid}:completed`])}
                                  onToggleAll={() => alternarLista(aluno.uuid, 'completed')}
                                  onOpenActivity={(atividadeUuid) => navigate(`/atividades/${atividadeUuid}`)}
                                />
                              </Grid>
                              <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex' }}>
                                <ActivityGroupCard
                                  kind="in_progress"
                                  activities={emProgresso}
                                  showAll={Boolean(listasExpandidas[`${aluno.uuid}:in_progress`])}
                                  onToggleAll={() => alternarLista(aluno.uuid, 'in_progress')}
                                  onOpenActivity={(atividadeUuid) => navigate(`/atividades/${atividadeUuid}`)}
                                />
                              </Grid>
                              <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex' }}>
                                <ActivityGroupCard
                                  kind="not_started"
                                  activities={naoIniciadas}
                                  showAll={Boolean(listasExpandidas[`${aluno.uuid}:not_started`])}
                                  onToggleAll={() => alternarLista(aluno.uuid, 'not_started')}
                                  onOpenActivity={(atividadeUuid) => navigate(`/atividades/${atividadeUuid}`)}
                                />
                              </Grid>
                            </Grid>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog open={Boolean(alunoParaRemover)} onClose={() => !removendo && setAlunoParaRemover(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remover aluno da turma?</DialogTitle>
        <DialogContent><Typography>{alunoParaRemover ? `Remover ${alunoParaRemover.nome} desta turma?` : ''}</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setAlunoParaRemover(null)} disabled={removendo}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={confirmarRemocao} disabled={removendo}>
            {removendo ? 'Removendo...' : 'Remover'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

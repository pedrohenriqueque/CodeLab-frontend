import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  IconButton,
  Tooltip,
  Skeleton,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  alpha,
  useTheme,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';

import useAtividadeDetail from '../hooks/useAtividadeDetail';
import TestCaseInputs from '../../../shared/components/TestCaseInputs';
import { formatTestCaseValue } from '../../../shared/components/testCaseValues';
import { encerrarAtividade, deleteAtividade, updateAtividade } from '../api';
import { getSubmissoes } from '../../submissoes/api';
import { useTurmaContext } from '../../turmas/context/TurmaContext';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';

function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export default function ActivityDetailPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useSnackbar();

  const { turmaAtiva, turmas, setTurmaAtiva } = useTurmaContext();
  const { atividade, loading, error, refetch } = useAtividadeDetail(uuid);

  // Submissões
  const [totalSubmissoes, setTotalSubmissoes] = useState(0);

  // Estados de Accordion das funções (todas abertas por padrão)
  const [collapsedFunctions, setCollapsedFunctions] = useState({});

  // Menu de opções ⋮
  const [menuAnchor, setMenuAnchor] = useState(null);

  // Diálogo: Editar Prazo
  const [editDeadlineOpen, setEditDeadlineOpen] = useState(false);
  const [newDeadlineDate, setNewDeadlineDate] = useState('');
  const [savingDeadline, setSavingDeadline] = useState(false);

  // Diálogo: Encerrar Atividade
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  // Diálogo: Excluir Atividade (Zona de perigo)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Carrega submissões da atividade
  useEffect(() => {
    let ativo = true;
    if (!uuid) return;
    getSubmissoes(null, null, uuid)
      .then((data) => {
        if (!ativo) return;
        const subs = (data || []).filter(
          (s) => s.atividadeUuid === uuid || s.atividade_uuid === uuid
        );
        setTotalSubmissoes(subs.length);
      })
      .catch(() => {
        if (ativo) setTotalSubmissoes(0);
      });
    return () => {
      ativo = false;
    };
  }, [uuid]);

  // Se for rascunho, redireciona diretamente para o assistente de edição/criação preenchido
  useEffect(() => {
    if (atividade?.status === 'RASCUNHO') {
      navigate(`/atividades/${uuid}/editar`, { replace: true });
    }
  }, [atividade?.status, uuid, navigate]);

  // Regras de negócio para exclusão: apenas rascunhos ou publicadas sem submissões
  const isEncerrada = atividade?.status === 'ENCERRADA';
  const hasSubmissoes =
    totalSubmissoes > 0 ||
    Boolean(atividade?.totalSubmissoes && atividade.totalSubmissoes > 0) ||
    Boolean(atividade?.total_submissoes && atividade.total_submissoes > 0) ||
    Boolean(atividade?.submissoes_count && atividade.submissoes_count > 0);
  const canDelete = !isEncerrada && !hasSubmissoes;

  // Navega para submissões filtradas por esta atividade
  const handleVerSubmissoes = () => {
    const tUuid = atividade?.turmaUuid || atividade?.turma_uuid;
    if (tUuid && turmaAtiva?.uuid !== tUuid) {
      const t = turmas.find((item) => item.uuid === tUuid);
      if (t) setTurmaAtiva(t);
    }
    navigate(`/submissoes?atividade=${uuid}`);
  };

  // Abre diálogo de edição de prazo com valores existentes
  const handleOpenEditDeadline = () => {
    if (isEncerrada || atividade?.status === 'ENCERRADA') {
      showError('Atividades encerradas não podem ter o prazo alterado.');
      return;
    }
    if (atividade?.fimEm || atividade?.dataFechamento) {
      const dateObj = new Date(atividade.fimEm || atividade.dataFechamento);
      if (!isNaN(dateObj.getTime())) {
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        setNewDeadlineDate(`${yyyy}-${mm}-${dd}`);
      } else {
        setNewDeadlineDate('');
      }
    } else {
      setNewDeadlineDate('');
    }
    setEditDeadlineOpen(true);
  };

  // Salva novo prazo (apenas dia, encerrando no final do dia às 23:59:59)
  const handleSaveDeadline = async () => {
    if (isEncerrada || atividade?.status === 'ENCERRADA') {
      showError('Atividades encerradas não podem ter o prazo alterado.');
      setEditDeadlineOpen(false);
      return;
    }
    if (!newDeadlineDate) {
      showError('Informe uma data válida.');
      return;
    }
    setSavingDeadline(true);
    try {
      const [ano, mes, dia] = newDeadlineDate.split('-').map(Number);
      const dataLimite = new Date(ano, mes - 1, dia, 23, 59, 59, 999);
      await updateAtividade(uuid, { fimEm: dataLimite.toISOString() });
      showSuccess('Prazo de encerramento atualizado com sucesso.');
      setEditDeadlineOpen(false);
      await refetch();
    } catch (err) {
      showError(err.response?.data?.detail || err.response?.data?.erro || 'Erro ao atualizar prazo.');
    } finally {
      setSavingDeadline(false);
    }
  };

  // Encerra atividade
  const handleConfirmClose = async () => {
    setClosing(true);
    try {
      await encerrarAtividade(uuid);
      showSuccess('Atividade encerrada com sucesso.');
      setCloseConfirmOpen(false);
      await refetch();
    } catch (err) {
      showError(err.response?.data?.detail || err.response?.data?.erro || 'Não foi possível encerrar a atividade.');
    } finally {
      setClosing(false);
    }
  };

  // Exclui atividade (bloqueado se encerrada ou com submissões)
  const handleConfirmDelete = async () => {
    if (!uuid || !canDelete) return;
    setDeleting(true);
    try {
      await deleteAtividade(uuid);
      showSuccess('Atividade excluída com sucesso.');
      navigate('/atividades');
    } catch (err) {
      showError(err.response?.data?.detail || err.response?.data?.erro || 'Não foi possível excluir a atividade.');
    } finally {
      setDeleting(false);
    }
  };

  const toggleFunctionAccordion = (id) => {
    setCollapsedFunctions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Nome da turma associada
  const turmaNome = (() => {
    if (!atividade?.turmaUuid) return turmaAtiva?.nome || 'Turma';
    const t = (turmas || []).find((item) => item.uuid === atividade.turmaUuid);
    return t?.nome || turmaAtiva?.nome || 'Turma';
  })();

  // Pontuação total
  const pontuacaoTotal = (() => {
    if (!atividade?.funcoes?.length) return 10.0;
    return atividade.funcoes.reduce((acc, f) => acc + Number(f.notaMaxima || f.peso || 0), 0);
  })();

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1280, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Skeleton variant="rounded" height={60} sx={{ borderRadius: 3 }} />
        <Skeleton variant="rounded" height={160} sx={{ borderRadius: 3.5 }} />
        <Skeleton variant="rounded" height={240} sx={{ borderRadius: 3.5 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 1280, mx: 'auto', p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!atividade) {
    return (
      <Box sx={{ maxWidth: 1280, mx: 'auto', p: 3 }}>
        <Alert severity="warning" sx={{ borderRadius: 3 }}>
          Atividade não encontrada.
        </Alert>
      </Box>
    );
  }

  const isProva = atividade.tipo === 'PROVA';
  const isRascunho = atividade.status === 'RASCUNHO';
  const totalFuncoes = atividade.funcoes?.length ?? 0;

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3.5, pb: 4 }}>
      {/* Top Bar / Voltar e Título */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Tooltip title="Voltar para atividades">
          <IconButton
            onClick={() => navigate('/atividades')}
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              bgcolor: isDark ? alpha('#3B82F6', 0.16) : '#EFF6FF',
              color: '#2563EB',
              '&:hover': {
                bgcolor: isDark ? alpha('#3B82F6', 0.25) : '#DBEAFE',
              },
            }}
          >
            <ArrowBackRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>

        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: 'text.primary',
              fontSize: { xs: '1.25rem', sm: '1.45rem' },
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            {isEncerrada ? 'Atividade encerrada' : isRascunho ? 'Atividade em rascunho' : 'Atividade publicada'}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mt: 0.25,
              fontSize: '0.85rem',
            }}
          >
            Visualize as informações gerais, funções associadas e ações disponíveis.
          </Typography>
        </Box>
      </Box>

      {/* Card Principal de Detalhes da Atividade */}
      <Card
        sx={{
          p: { xs: 2.5, sm: 3 },
          borderRadius: 3.5,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
          bgcolor: 'background.paper',
        }}
      >
        {/* Linha Superior: Ícone, Título, Badges e Botões de Ação */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', lg: 'center' },
            gap: 2.5,
            mb: 2.5,
          }}
        >
          {/* Lado Esquerdo: Ícone + Título + Badges */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                bgcolor: isDark ? alpha('#3B82F6', 0.16) : '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AssignmentOutlinedIcon sx={{ fontSize: 26 }} />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: 'text.primary',
                  fontSize: { xs: '1.2rem', sm: '1.35rem' },
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                {atividade.titulo}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75, flexWrap: 'wrap' }}>
                {/* Badge de Tipo */}
                {isProva ? (
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 1.2,
                      py: 0.35,
                      borderRadius: 2,
                      bgcolor: isDark ? alpha('#8B5CF6', 0.18) : '#F3E8FF',
                      color: isDark ? '#C4B5FD' : '#7C3AED',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    <span>Trabalho avaliativo</span>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 1.2,
                      py: 0.35,
                      borderRadius: 2,
                      bgcolor: isDark ? alpha('#3B82F6', 0.18) : '#EFF6FF',
                      color: isDark ? '#93C5FD' : '#2563EB',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    <span>+ Exercício de prática</span>
                  </Box>
                )}

                {/* Badge de Status */}
                {isEncerrada ? (
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.75,
                      px: 1.2,
                      py: 0.35,
                      borderRadius: 2,
                      bgcolor: isDark ? alpha('#64748B', 0.18) : '#F1F5F9',
                      color: isDark ? '#CBD5E1' : '#475569',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#64748B' }} />
                    <span>Encerrada</span>
                  </Box>
                ) : isRascunho ? (
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.75,
                      px: 1.2,
                      py: 0.35,
                      borderRadius: 2,
                      bgcolor: isDark ? alpha('#F59E0B', 0.18) : '#FFFBEB',
                      color: isDark ? '#FCD34D' : '#D97706',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#F59E0B' }} />
                    <span>Rascunho</span>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.75,
                      px: 1.2,
                      py: 0.35,
                      borderRadius: 2,
                      bgcolor: isDark ? alpha('#10B981', 0.18) : '#ECFDF5',
                      color: isDark ? '#6EE7B7' : '#10B981',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10B981' }} />
                    <span>Publicada</span>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          {/* Lado Direito: Ações */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              flexWrap: 'wrap',
              width: { xs: '100%', lg: 'auto' },
            }}
          >
            {/* Botão Ver Submissões */}
            <Button
              variant="contained"
              startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 18 }} />}
              onClick={handleVerSubmissoes}
              sx={{
                bgcolor: '#2563EB',
                color: '#FFFFFF',
                borderRadius: 2,
                px: 2.25,
                py: 0.85,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8125rem',
                boxShadow: 'none',
                whiteSpace: 'nowrap',
                '&:hover': {
                  bgcolor: '#1D4ED8',
                  boxShadow: 'none',
                },
              }}
            >
              Ver submissões
            </Button>

            {/* Botão Editar Prazo */}
            {!isEncerrada && (
              <Button
                variant="outlined"
                startIcon={<CalendarTodayOutlinedIcon sx={{ fontSize: 16 }} />}
                onClick={handleOpenEditDeadline}
                sx={{
                  borderColor: '#BFDBFE',
                  color: '#2563EB',
                  borderRadius: 2,
                  px: 2,
                  py: 0.85,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    borderColor: '#2563EB',
                    bgcolor: alpha('#2563EB', 0.05),
                  },
                }}
              >
                Editar prazo
              </Button>
            )}

            {/* Botão Encerrar Atividade */}
            <Button
              variant="outlined"
              startIcon={<StopCircleOutlinedIcon sx={{ fontSize: 17 }} />}
              onClick={() => setCloseConfirmOpen(true)}
              disabled={isEncerrada}
              sx={{
                borderColor: '#FDBA74',
                color: '#EA580C',
                borderRadius: 2,
                px: 2,
                py: 0.85,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8125rem',
                whiteSpace: 'nowrap',
                '&:hover': {
                  borderColor: '#EA580C',
                  bgcolor: alpha('#EA580C', 0.05),
                },
              }}
            >
              Encerrar atividade
            </Button>

            {/* Menu ⋮ */}
            <IconButton
              size="small"
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                color: 'text.secondary',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <MoreVertRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        <Divider sx={{ my: 2.5 }} />

        {/* Linha Inferior: 5 Metadados Chave */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(5, 1fr)',
            },
            gap: 2.5,
            alignItems: 'center',
          }}
        >
          {/* Metadado 1: Período */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CalendarTodayOutlinedIcon sx={{ fontSize: 22, color: 'text.secondary', flexShrink: 0 }} />
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.75rem', lineHeight: 1.2 }}>
                Período
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.8125rem', mt: 0.25, whiteSpace: 'nowrap' }}>
                {formatDate(atividade.inicioEm || atividade.dataAbertura)} → {formatDate(atividade.fimEm || atividade.dataFechamento)}
              </Typography>
            </Box>
          </Box>

          {/* Metadado 2: Funções */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CodeRoundedIcon sx={{ fontSize: 24, color: 'text.secondary', flexShrink: 0 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.8125rem', lineHeight: 1.2 }}>
                {totalFuncoes} {totalFuncoes === 1 ? 'função' : 'funções'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.75rem', mt: 0.25 }}>
                na atividade
              </Typography>
            </Box>
          </Box>

          {/* Metadado 3: Submissões */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <DescriptionOutlinedIcon sx={{ fontSize: 22, color: 'text.secondary', flexShrink: 0 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.8125rem', lineHeight: 1.2 }}>
                {totalSubmissoes} {totalSubmissoes === 1 ? 'submissão' : 'submissões'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.75rem', mt: 0.25 }}>
                enviadas
              </Typography>
            </Box>
          </Box>

          {/* Metadado 4: Turma */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <GroupsOutlinedIcon sx={{ fontSize: 24, color: 'text.secondary', flexShrink: 0 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.75rem', lineHeight: 1.2 }}>
                Turma
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.8125rem', mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={turmaNome}>
                {turmaNome}
              </Typography>
            </Box>
          </Box>

          {/* Metadado 5: Nota atribuída */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <StarBorderRoundedIcon sx={{ fontSize: 24, color: 'text.secondary', flexShrink: 0 }} />
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.75rem', lineHeight: 1.2 }}>
                Nota atribuída
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.8125rem', mt: 0.25 }}>
                {pontuacaoTotal.toFixed(1)} pts
              </Typography>
            </Box>
          </Box>
        </Box>
      </Card>

      {/* Seção: Funções da atividade */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              color: 'text.primary',
              fontSize: { xs: '1.15rem', sm: '1.25rem' },
              letterSpacing: '-0.02em',
            }}
          >
            Funções da atividade
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mt: 0.25,
              fontSize: '0.8125rem',
            }}
          >
            Abaixo estão as funções incluídas nesta atividade e seus casos de teste.
          </Typography>
        </Box>

        {totalFuncoes === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 5,
              textAlign: 'center',
              borderRadius: 3.5,
              borderColor: 'divider',
              boxShadow: 'none',
            }}
          >
            <CodeRoundedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              Nenhuma função associada a esta atividade.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {atividade.funcoes.map((funcao, index) => {
              const fId = funcao.uuid || funcao.funcaoUuid;
              const isExpanded = !collapsedFunctions[fId];
              const casos = funcao.casosTeste || [];
              const dificuldadeStr = String(funcao.dificuldade || 'FACIL').toUpperCase();

              return (
                <Accordion
                  key={fId || index}
                  expanded={isExpanded}
                  onChange={() => toggleFunctionAccordion(fId)}
                  disableGutters
                  sx={{
                    borderRadius: '16px !important',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:before': { display: 'none' },
                    overflow: 'hidden',
                    bgcolor: 'background.paper',
                    boxShadow: 'none',
                    transition: 'border-color 0.15s ease',
                    '&:hover': {
                      borderColor: (t) =>
                        t.palette.mode === 'dark' ? alpha(t.palette.primary.main, 0.4) : alpha(t.palette.primary.main, 0.3),
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreRoundedIcon sx={{ color: 'text.secondary' }} />}
                    sx={{
                      px: { xs: 2, sm: 2.5 },
                      py: 1,
                      '& .MuiAccordionSummary-content': { my: 0.75, alignItems: 'center' },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        gap: 2,
                        width: '100%',
                        pr: 1,
                      }}
                    >
                      {/* Lado Esquerdo: Tag # Ordem + Nome e Descrição */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 28,
                            borderRadius: 1.5,
                            bgcolor: isDark ? alpha('#64748B', 0.2) : '#F1F5F9',
                            color: isDark ? '#CBD5E1' : '#475569',
                            fontWeight: 700,
                            fontSize: '0.8125rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          #{funcao.ordem || index + 1}
                        </Box>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '0.9375rem',
                              color: 'text.primary',
                              lineHeight: 1.3,
                            }}
                          >
                            {funcao.nomeFuncao || funcao.nome}()
                          </Typography>
                          {(funcao.descricao || funcao.enunciado) && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'text.secondary',
                                fontSize: '0.75rem',
                                display: 'block',
                                mt: 0.25,
                              }}
                            >
                              {funcao.descricao || funcao.enunciado}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Lado Direito: Dificuldade + Nota + Olho */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexShrink: 0 }}>
                        {/* Dificuldade */}
                        {dificuldadeStr === 'MEDIO' ? (
                          <Box
                            sx={{
                              px: 1.25,
                              py: 0.35,
                              borderRadius: 2,
                              border: '1px solid #FDBA74',
                              color: '#EA580C',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              bgcolor: isDark ? alpha('#EA580C', 0.1) : 'transparent',
                            }}
                          >
                            Médio
                          </Box>
                        ) : dificuldadeStr === 'DIFICIL' ? (
                          <Box
                            sx={{
                              px: 1.25,
                              py: 0.35,
                              borderRadius: 2,
                              border: '1px solid #FCA5A5',
                              color: '#DC2626',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              bgcolor: isDark ? alpha('#DC2626', 0.1) : 'transparent',
                            }}
                          >
                            Difícil
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              px: 1.25,
                              py: 0.35,
                              borderRadius: 2,
                              border: '1px solid #86EFAC',
                              color: '#16A34A',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              bgcolor: isDark ? alpha('#16A34A', 0.1) : 'transparent',
                            }}
                          >
                            Fácil
                          </Box>
                        )}

                        {/* Nota da Função */}
                        <Box
                          sx={{
                            px: 1.35,
                            py: 0.35,
                            borderRadius: 2,
                            bgcolor: '#2563EB',
                            color: '#FFFFFF',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            letterSpacing: '0.01em',
                          }}
                        >
                          {Number(funcao.notaMaxima || funcao.peso || 0).toFixed(2)} pts
                        </Box>

                        {/* Botão de Ver Submissões desta Função */}
                        <Tooltip title="Ver submissões desta função">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/atividades/${uuid}/funcao/${fId}/submissoes`);
                            }}
                            sx={{
                              color: '#2563EB',
                              p: 0.5,
                              '&:hover': { bgcolor: alpha('#2563EB', 0.08) },
                            }}
                          >
                            <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </AccordionSummary>

                  {/* Tabela de Casos de Teste da Função */}
                  <AccordionDetails
                    sx={{
                      px: { xs: 2, sm: 2.5 },
                      pb: 2.5,
                      pt: 1.5,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      bgcolor: isDark ? alpha(theme.palette.background.default, 0.4) : '#FAFBFD',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        gap: 1,
                        mb: 1.5,
                      }}
                    >
                      <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', color: 'text.primary' }}>
                        Casos de teste copiados para esta atividade ({casos.length})
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                        Todos os casos da função foram copiados para o snapshot da atividade.
                      </Typography>
                    </Box>

                    {casos.length === 0 ? (
                      <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
                        Nenhum caso de teste configurado para esta função.
                      </Alert>
                    ) : (
                      <TableContainer
                        component={Paper}
                        variant="outlined"
                        sx={{
                          borderRadius: 2.5,
                          borderColor: 'divider',
                          boxShadow: 'none',
                          overflow: 'hidden',
                        }}
                      >
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: isDark ? alpha(theme.palette.background.default, 0.6) : '#F8FAFC' }}>
                              <TableCell sx={{ width: 60, py: 1.2, fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>
                                #
                              </TableCell>
                              <TableCell sx={{ width: 90, py: 1.2, fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>
                                PESO
                              </TableCell>
                              <TableCell sx={{ width: 130, py: 1.2, fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>
                                VISIBILIDADE
                              </TableCell>
                              <TableCell sx={{ py: 1.2, fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>
                                INPUTS
                              </TableCell>
                              <TableCell sx={{ py: 1.2, fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>
                                SAÍDA ESPERADA
                              </TableCell>
                              <TableCell sx={{ py: 1.2, fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>
                                DESCRIÇÃO
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {casos.map((caso, cIdx) => {
                              const isOculto = caso.oculto || caso.visibilidade === 'OCULTO';
                              return (
                                <TableRow key={caso.uuid || caso.casoTesteUuid || cIdx}>
                                  <TableCell sx={{ py: 1.2, fontWeight: 700, fontSize: '0.8125rem' }}>
                                    #{caso.numero || cIdx + 1}
                                  </TableCell>
                                  <TableCell sx={{ py: 1.2, fontWeight: 600, fontSize: '0.8125rem' }}>
                                    {Number(caso.pesoCaso ?? caso.peso ?? 1).toFixed(2)}
                                  </TableCell>
                                  <TableCell sx={{ py: 1.2 }}>
                                    {isOculto ? (
                                      <Box
                                        sx={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 0.6,
                                          px: 1,
                                          py: 0.25,
                                          borderRadius: 1.5,
                                          bgcolor: isDark ? alpha('#64748B', 0.2) : '#F1F5F9',
                                          color: isDark ? '#CBD5E1' : '#475569',
                                          fontSize: '0.75rem',
                                          fontWeight: 600,
                                        }}
                                      >
                                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#64748B' }} />
                                        <span>Oculto</span>
                                      </Box>
                                    ) : (
                                      <Box
                                        sx={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 0.6,
                                          px: 1,
                                          py: 0.25,
                                          borderRadius: 1.5,
                                          bgcolor: isDark ? alpha('#10B981', 0.16) : '#ECFDF5',
                                          color: isDark ? '#6EE7B7' : '#10B981',
                                          fontSize: '0.75rem',
                                          fontWeight: 600,
                                        }}
                                      >
                                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10B981' }} />
                                        <span>Visível</span>
                                      </Box>
                                    )}
                                  </TableCell>
                                  <TableCell sx={{ py: 1.2, fontFamily: 'monospace', fontSize: '0.8125rem', color: 'text.primary' }}>
                                    <TestCaseInputs entradas={caso.entradas ?? caso.inputs} parametros={funcao.parametros} />
                                  </TableCell>
                                  <TableCell sx={{ py: 1.2, fontFamily: 'monospace', fontSize: '0.8125rem', color: 'text.primary' }}>
                                    {formatTestCaseValue(caso.retornoEsperado ?? caso.outputEsperado)}
                                  </TableCell>
                                  <TableCell sx={{ py: 1.2, color: 'text.secondary', fontSize: '0.8125rem' }}>
                                    {caso.descricao || '-'}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Zona de Perigo (Exclusão da atividade) */}
      <Box
        sx={{
          p: { xs: 2.25, sm: 2.5 },
          borderRadius: 3.5,
          border: '1px solid',
          borderColor: canDelete
            ? isDark
              ? alpha('#EF4444', 0.4)
              : '#FCA5A5'
            : isDark
            ? alpha('#94A3B8', 0.25)
            : '#E2E8F0',
          bgcolor: canDelete
            ? isDark
              ? alpha('#EF4444', 0.08)
              : '#FEF2F2'
            : isDark
            ? alpha('#64748B', 0.07)
            : '#F8FAFC',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          transition: 'all 0.2s ease',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <WarningAmberRoundedIcon
            sx={{
              fontSize: 32,
              color: canDelete ? '#DC2626' : isDark ? '#64748B' : '#94A3B8',
              flexShrink: 0,
            }}
          />
          <Box>
            <Typography
              sx={{
                fontWeight: 800,
                color: canDelete ? '#DC2626' : isDark ? '#94A3B8' : '#64748B',
                fontSize: '0.95rem',
              }}
            >
              Zona de perigo {!canDelete && '(indisponível)'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8125rem', mt: 0.25 }}>
              {!canDelete
                ? isEncerrada && hasSubmissoes
                  ? 'Esta atividade está encerrada e possui submissões registradas. A exclusão permanente só está disponível para rascunhos ou atividades publicadas sem submissões.'
                  : hasSubmissoes
                  ? `Esta atividade possui ${totalSubmissoes} ${totalSubmissoes === 1 ? 'submissão registrada' : 'submissões registradas'}. A exclusão permanente só está disponível para rascunhos ou atividades publicadas sem submissões.`
                  : 'Esta atividade está encerrada. A exclusão permanente só está disponível para rascunhos ou atividades publicadas sem submissões.'
                : 'A exclusão permanente só está disponível para rascunhos ou atividades publicadas sem submissões.'}
            </Typography>
          </Box>
        </Box>

        <Tooltip
          title={
            !canDelete
              ? isEncerrada && hasSubmissoes
                ? 'Atividades encerradas e com submissões não podem ser excluídas'
                : hasSubmissoes
                ? 'Atividades com submissões enviadas não podem ser excluídas'
                : 'Atividades encerradas não podem ser excluídas'
              : ''
          }
          disableHoverListener={canDelete}
        >
          <span>
            <Button
              variant="outlined"
              color={canDelete ? 'error' : 'inherit'}
              disabled={!canDelete}
              startIcon={<DeleteOutlineRoundedIcon />}
              onClick={() => canDelete && setDeleteConfirmOpen(true)}
              sx={{
                borderRadius: 2.5,
                bgcolor: canDelete
                  ? 'background.paper'
                  : isDark
                  ? alpha('#64748B', 0.08)
                  : '#F1F5F9',
                borderColor: canDelete
                  ? '#F87171'
                  : isDark
                  ? alpha('#94A3B8', 0.25)
                  : '#CBD5E1',
                color: canDelete ? '#DC2626' : isDark ? '#64748B' : '#94A3B8',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.8125rem',
                px: 2.25,
                py: 0.85,
                whiteSpace: 'nowrap',
                cursor: canDelete ? 'pointer' : 'not-allowed',
                '&:hover': canDelete
                  ? {
                      bgcolor: alpha('#DC2626', 0.05),
                      borderColor: '#DC2626',
                    }
                  : {},
                '&.Mui-disabled': {
                  bgcolor: isDark ? alpha('#64748B', 0.08) : '#F1F5F9',
                  borderColor: isDark ? alpha('#94A3B8', 0.25) : '#CBD5E1',
                  color: isDark ? '#64748B' : '#94A3B8',
                },
              }}
            >
              Excluir atividade
            </Button>
          </span>
        </Tooltip>
      </Box>

      {/* Menu dropdown ⋮ */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.75,
              borderRadius: 2.5,
              minWidth: 190,
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: 'divider',
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            handleVerSubmissoes();
          }}
          sx={{ fontSize: '0.8125rem', py: 1 }}
        >
          <ListItemIcon sx={{ minWidth: 30 }}>
            <FactCheckOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          </ListItemIcon>
          <ListItemText primary="Ver submissões" primaryTypographyProps={{ fontSize: '0.8125rem' }} />
        </MenuItem>
        {!isEncerrada && (
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              handleOpenEditDeadline();
            }}
            sx={{ fontSize: '0.8125rem', py: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 30 }}>
              <CalendarTodayOutlinedIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
            </ListItemIcon>
            <ListItemText primary="Editar prazo" primaryTypographyProps={{ fontSize: '0.8125rem' }} />
          </MenuItem>
        )}
        <Divider sx={{ my: 0.5 }} />
        <Tooltip
          title={
            !canDelete
              ? isEncerrada && hasSubmissoes
                ? 'Atividades encerradas e com submissões não podem ser excluídas'
                : hasSubmissoes
                ? 'Atividades com submissões enviadas não podem ser excluídas'
                : 'Atividades encerradas não podem ser excluídas'
              : ''
          }
          placement="left"
          disableHoverListener={canDelete}
        >
          <span>
            <MenuItem
              disabled={!canDelete}
              onClick={() => {
                setMenuAnchor(null);
                if (canDelete) setDeleteConfirmOpen(true);
              }}
              sx={{
                fontSize: '0.8125rem',
                py: 1,
                color: canDelete ? '#EF4444' : 'text.disabled',
                '&:hover': canDelete ? { bgcolor: alpha('#EF4444', 0.08) } : {},
              }}
            >
              <ListItemIcon sx={{ minWidth: 30, color: canDelete ? '#EF4444' : 'text.disabled' }}>
                <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
              </ListItemIcon>
              <ListItemText
                primary="Excluir atividade"
                primaryTypographyProps={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: canDelete ? '#EF4444' : 'text.disabled',
                }}
              />
            </MenuItem>
          </span>
        </Tooltip>
      </Menu>

      {/* Modal: Editar Prazo */}
      <Dialog
        open={editDeadlineOpen}
        onClose={() => !savingDeadline && setEditDeadlineOpen(false)}
        PaperProps={{ sx: { borderRadius: 3.5, p: 1, maxWidth: 420 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.15rem' }}>
          Editar prazo de encerramento
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.875rem', mb: 2.5 }}>
            Defina a nova data limite para entrega de soluções nesta atividade.
          </DialogContentText>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              type="date"
              label="Data de encerramento"
              value={newDeadlineDate}
              onChange={(e) => setNewDeadlineDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setEditDeadlineOpen(false)}
            disabled={savingDeadline}
            sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveDeadline}
            variant="contained"
            disabled={savingDeadline}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              bgcolor: '#2563EB',
              boxShadow: 'none',
              '&:hover': { bgcolor: '#1D4ED8', boxShadow: 'none' },
            }}
          >
            {savingDeadline ? 'Salvando...' : 'Salvar prazo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Encerrar Atividade */}
      <Dialog
        open={closeConfirmOpen}
        onClose={() => !closing && setCloseConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 3.5, p: 1, maxWidth: 420 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.15rem' }}>
          Encerrar atividade
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.875rem' }}>
            Tem certeza de que deseja encerrar a atividade agora? Nenhum aluno poderá enviar novas submissões após o encerramento.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setCloseConfirmOpen(false)}
            disabled={closing}
            sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmClose}
            variant="contained"
            color="warning"
            disabled={closing}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, boxShadow: 'none' }}
          >
            {closing ? 'Encerrando...' : 'Encerrar agora'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Excluir Atividade */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => !deleting && setDeleteConfirmOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3.5,
            p: 1,
            maxWidth: 440,
            ...(!canDelete && {
              bgcolor: isDark ? '#1E293B' : '#F8FAFC',
              border: '1px solid',
              borderColor: isDark ? alpha('#94A3B8', 0.2) : '#E2E8F0',
            }),
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            fontSize: '1.15rem',
            color: canDelete ? '#DC2626' : isDark ? '#94A3B8' : '#64748B',
          }}
        >
          {canDelete ? 'Excluir atividade permanentemente' : 'Exclusão não permitida'}
        </DialogTitle>
        <DialogContent>
          {canDelete ? (
            <DialogContentText sx={{ fontSize: '0.875rem' }}>
              Tem certeza de que deseja excluir permanentemente a atividade{' '}
              <strong>"{atividade.titulo}"</strong>? Esta ação é irreversível.
            </DialogContentText>
          ) : (
            <Box sx={{ mt: 0.5 }}>
              <DialogContentText sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 1.5 }}>
                A atividade <strong>"{atividade.titulo}"</strong> não pode ser excluída.
              </DialogContentText>
              <Alert
                severity="info"
                icon={<WarningAmberRoundedIcon sx={{ color: isDark ? '#94A3B8' : '#64748B' }} />}
                sx={{
                  borderRadius: 2,
                  bgcolor: isDark ? alpha('#64748B', 0.15) : '#F1F5F9',
                  color: 'text.secondary',
                  border: '1px solid',
                  borderColor: isDark ? alpha('#94A3B8', 0.2) : '#E2E8F0',
                  '& .MuiAlert-icon': {
                    color: isDark ? '#94A3B8' : '#64748B',
                  },
                }}
              >
                {isEncerrada && hasSubmissoes
                  ? 'Esta atividade está encerrada e possui submissões registradas.'
                  : hasSubmissoes
                  ? `Esta atividade possui ${totalSubmissoes} submissão(ões) de alunos registradas.`
                  : 'Esta atividade já foi encerrada.'}
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            disabled={deleting}
            sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
          >
            {canDelete ? 'Cancelar' : 'Fechar'}
          </Button>
          {canDelete && (
            <Button
              onClick={handleConfirmDelete}
              variant="contained"
              color="error"
              disabled={deleting}
              startIcon={<DeleteOutlineRoundedIcon />}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, boxShadow: 'none' }}
            >
              {deleting ? 'Excluindo...' : 'Excluir atividade'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

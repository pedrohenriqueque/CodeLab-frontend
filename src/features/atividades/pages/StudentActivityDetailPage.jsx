/**
 * StudentActivityDetailPage — detalhe de atividade para o aluno.
 *
 * Exibe metadados da atividade, progresso consolidado, lista de funções com status
 * detalhado por função.
 */

import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Breadcrumbs,
  Link,
  Skeleton,
  Alert,
  Divider,
} from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

import useAtividadeDetail from '../hooks/useAtividadeDetail';
import useActivityProgress from '../hooks/useActivityProgress';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function deriveFuncaoStatus(prog, funcao, isProva) {
  const pontosMax = funcao.peso ?? funcao.pontos ?? 10;
  if (!prog || prog.tentativasUsadas === 0) return 'nao_iniciada';
  if (isProva) return 'enviada';
  const nota = prog.melhorNota ?? 0;
  if (nota >= pontosMax) return 'concluida';
  return 'em_andamento';
}

// ─── StatusIcon ──────────────────────────────────────────────────────────────

function StatusIcon({ status }) {
  if (status === 'concluida') {
    return <CheckCircleIcon sx={{ fontSize: 22, color: '#22c55e' }} />;
  }
  if (status === 'em_andamento') {
    return <WarningAmberIcon sx={{ fontSize: 22, color: '#f59e0b' }} />;
  }
  if (status === 'enviada') {
    return <TaskAltIcon sx={{ fontSize: 22, color: '#2563eb' }} />;
  }
  return <RadioButtonUncheckedIcon sx={{ fontSize: 22, color: '#d1d5db' }} />;
}

// ─── Function Row ────────────────────────────────────────────────────────────

function FuncaoRow({ funcao, prog, uuid, isLast, navigate, isProva }) {
  const targetFuncUuid = funcao.funcaoUuid || funcao.uuid;
  const tentativas = prog?.tentativasUsadas ?? 0;
  const melhorNota = prog?.melhorNota ?? 0;
  const status = deriveFuncaoStatus(prog, funcao, isProva);
  const pontosMax = funcao.peso ?? funcao.pontos ?? 10;
  const numCasos = funcao.casosTeste?.length ?? 0;

  const statusChip = {
    concluida: { label: 'Concluída', bgcolor: '#dcfce7', color: '#15803d' },
    em_andamento: {
      label: `${tentativas} tentativa${tentativas > 1 ? 's' : ''}`,
      bgcolor: '#fef3c7',
      color: '#b45309',
    },
    enviada: { label: 'Enviada', bgcolor: '#dbeafe', color: '#1d4ed8' },
    nao_iniciada: { label: 'Não iniciada', bgcolor: '#f3f4f6', color: '#6b7280' },
  }[status];

  return (
    <>
      <Box
        onClick={() => navigate(`/aluno/atividades/${uuid}/funcao/${targetFuncUuid}/submeter`)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          py: 2,
          px: 0.5,
          cursor: 'pointer',
          borderRadius: 2,
          mx: -0.5,
          transition: 'background 0.15s',
          '&:hover': { backgroundColor: 'action.hover' },
        }}
      >
        {/* Status icon */}
        <StatusIcon status={status} />

        {/* Main info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body1"
            sx={{ fontWeight: 700, fontSize: '0.9rem', fontFamily: 'monospace', mb: 0.25 }}
          >
            {funcao.nomeFuncao}()
          </Typography>

          {funcao.descricao && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                fontSize: '0.8rem',
                mb: 0.4,
              }}
            >
              {funcao.descricao}
            </Typography>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {pontosMax.toFixed(1)} pontos
            </Typography>
            {numCasos > 0 && (
              <>
                <Typography variant="caption" color="text.secondary">·</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  {numCasos} caso{numCasos !== 1 ? 's' : ''} de teste
                </Typography>
              </>
            )}
            {funcao.dificuldade && (
              <>
                <Typography variant="caption" color="text.secondary">·</Typography>
                <Typography variant="caption" sx={{ textTransform: 'capitalize', fontSize: '0.75rem' }}>
                  {funcao.dificuldade}
                </Typography>
              </>
            )}
          </Box>
        </Box>

        {/* Score + chip */}
        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
          {!isProva && tentativas > 0 && (
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.9rem', mb: 0.5 }}>
              {melhorNota.toFixed(1)}{' '}
              <Typography component="span" sx={{ fontWeight: 400, color: 'text.secondary', fontSize: '0.8rem' }}>
                / {pontosMax.toFixed(1)}
              </Typography>
            </Typography>
          )}
          <Chip
            label={statusChip.label}
            size="small"
            sx={{
              bgcolor: statusChip.bgcolor,
              color: statusChip.color,
              fontWeight: 600,
              fontSize: '0.68rem',
              height: 20,
              border: 'none',
            }}
          />
        </Box>

        <ArrowForwardIosIcon sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }} />
      </Box>
      {!isLast && <Divider />}
    </>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function StudentActivityDetailPage() {
  const { uuid } = useParams();
  const navigate = useNavigate();

  const { atividade, loading, error } = useAtividadeDetail(uuid);
  const { progresso } = useActivityProgress(uuid);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Skeleton variant="text" width={240} height={28} />
        <Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: 2 }} />
        ))}
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!atividade) return <Alert severity="warning">Atividade não encontrada.</Alert>;

  const isFechada =
    atividade.status === 'ENCERRADA' ||
    (atividade.dataFechamento && new Date(atividade.dataFechamento) < new Date());
  const isProva = atividade.tipo?.toUpperCase() === 'PROVA';

  const funcoes = atividade.funcoes ?? [];
  const totalPontos = funcoes.reduce((s, f) => s + (f.peso ?? f.pontos ?? 10), 0);

  let pontosObtidos = 0;
  let funcoesConcluidas = 0;
  for (const f of funcoes) {
    const targetFuncUuid = f.funcaoUuid || f.uuid;
    const prog = progresso.find((p) => p.funcaoUuid === targetFuncUuid);
    const pesoFunc = f.peso ?? f.pontos ?? 10;
    if (!isProva && prog && prog.tentativasUsadas > 0) {
      pontosObtidos += prog.melhorNota ?? 0;
      if ((prog.melhorNota ?? 0) >= pesoFunc) funcoesConcluidas++;
    }
  }

  const progressoPct = funcoes.length > 0
    ? Math.round((funcoesConcluidas / funcoes.length) * 100)
    : 0;

  const funcoesEnviadas = progresso.filter((funcao) => funcao.tentativasUsadas > 0).length;

  return (
    <Box className="fade-in">
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2.5 }}>
        <Link
          underline="hover"
          color="inherit"
          sx={{ cursor: 'pointer', fontSize: '0.875rem' }}
          onClick={() => navigate('/aluno/atividades')}
        >
          Atividades
        </Link>
        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
          {atividade.titulo}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {atividade.titulo}
            </Typography>
            {isFechada ? (
              <Chip label="Encerrada" size="small" variant="outlined" />
            ) : (
              <Chip label="Em andamento" color="primary" size="small" variant="outlined" />
            )}
          </Box>
          {atividade.descricao && (
            <Typography variant="body2" color="text.secondary">
              {atividade.descricao}
            </Typography>
          )}
        </Box>

      </Box>

      {/* Alerta de Atividade Encerrada por Prazo */}
      {isFechada && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          Esta atividade está encerrada pelo prazo. O envio de novas submissões está desabilitado, mas você ainda pode visualizar suas soluções.
        </Alert>
      )}

      {/* Metadata row */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2, pb: '16px !important' }}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 3,
              divideX: true,
            }}
          >
            {/* Período */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.4, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Período
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarTodayOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                  {formatDate(atividade.dataAbertura)}
                  {atividade.dataFechamento && ` — ${formatDate(atividade.dataFechamento)}`}
                </Typography>
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Pontuação máxima */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.4, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Pontuação máxima
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {totalPontos.toFixed(1)} pontos
              </Typography>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Progresso */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.4, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {isProva ? 'Funções enviadas' : 'Seu progresso'}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {isProva ? `${funcoesEnviadas} de ${funcoes.length}` : `${pontosObtidos.toFixed(1)} / ${totalPontos.toFixed(1)} (${progressoPct}%)`}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Functions section */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', mb: 0.4 }}>
          Funções da atividade ({funcoes.length})
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Clique em uma função para ver o enunciado, escrever seu código e enviar sua solução.
        </Typography>
      </Box>

      {funcoes.length === 0 ? (
        <Alert severity="info" variant="outlined">
          Nenhum exercício disponível nesta atividade.
        </Alert>
      ) : (
        <Card variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
          {funcoes.map((funcao, idx) => {
            const targetFuncUuid = funcao.funcaoUuid || funcao.uuid;
            const prog = progresso.find((p) => p.funcaoUuid === targetFuncUuid);
            return (
              <FuncaoRow
                key={targetFuncUuid}
                funcao={funcao}
                prog={prog}
                uuid={uuid}
                isLast={idx === funcoes.length - 1}
                navigate={navigate}
                isProva={isProva}
              />
            );
          })}
        </Card>
      )}

    </Box>
  );
}

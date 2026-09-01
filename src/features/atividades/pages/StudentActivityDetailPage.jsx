/**
 * StudentActivityDetailPage — detalhe de atividade para o aluno.
 *
 * Exibe metadados da atividade, progresso e lista de funções com status detalhado.
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
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';

import useAtividadeDetail from '../hooks/useAtividadeDetail';
import useProgresso from '../hooks/useProgresso';
import { useAuth } from '../../auth/hooks/useAuthProvider';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function deriveFuncaoStatus(prog, funcao) {
  if (!prog || prog.tentativasUsadas === 0) return 'pendente';
  const nota = prog.melhorNota ?? 0;
  if (nota >= (funcao.pontos ?? 0)) return 'aprovada';
  return 'parcial';
}

// ─── StatusIcon ──────────────────────────────────────────────────────────────

function StatusIcon({ status }) {
  if (status === 'aprovada') {
    return <CheckCircleIcon sx={{ fontSize: 22, color: '#22c55e' }} />;
  }
  if (status === 'parcial') {
    return <WarningAmberIcon sx={{ fontSize: 22, color: '#f59e0b' }} />;
  }
  return <RadioButtonUncheckedIcon sx={{ fontSize: 22, color: '#d1d5db' }} />;
}

// ─── Function Row ────────────────────────────────────────────────────────────

function FuncaoRow({ funcao, prog, uuid, isFechada, isLast, navigate }) {
  const tentativas = prog?.tentativasUsadas ?? 0;
  const melhorNota = prog?.melhorNota ?? 0;
  const status = deriveFuncaoStatus(prog, funcao);
  const pontosMax = funcao.pontos ?? 0;
  const numCasos = funcao.casosTeste?.length ?? 0;

  const statusChip = {
    aprovada: { label: 'Aprovada', bgcolor: '#dcfce7', color: '#15803d' },
    parcial:  { label: 'Parcial',  bgcolor: '#fef3c7', color: '#b45309' },
    pendente: { label: 'Pendente', bgcolor: '#f3f4f6', color: '#6b7280' },
  }[status];

  return (
    <>
      <Box
        onClick={() => navigate(`/aluno/atividades/${uuid}/funcao/${funcao.uuid}/submeter`)}
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
          </Box>
        </Box>

        {/* Score + chip */}
        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
          {tentativas > 0 && (
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
  const { user } = useAuth();
  const { atividade, loading, error } = useAtividadeDetail(uuid);
  const { progresso } = useProgresso(user?.uuid);

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
    atividade.status === 'fechado' ||
    (atividade.dataFechamento && new Date(atividade.dataFechamento) < new Date());

  const funcoes = atividade.funcoes ?? [];
  const totalPontos = funcoes.reduce((s, f) => s + (f.pontos ?? 0), 0);

  let pontosObtidos = 0;
  let funcoesConcluidas = 0;
  for (const f of funcoes) {
    const prog = progresso.find((p) => p.funcaoUuid === f.uuid);
    if (prog && prog.tentativasUsadas > 0) {
      pontosObtidos += prog.melhorNota;
      if (prog.melhorNota >= (f.pontos ?? 0)) funcoesConcluidas++;
    }
  }

  const progressoPct = funcoes.length > 0
    ? Math.round((funcoesConcluidas / funcoes.length) * 100)
    : 0;

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

      {/* Title */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          {atividade.titulo}
        </Typography>
        {atividade.descricao && (
          <Typography variant="body2" color="text.secondary">
            {atividade.descricao}
          </Typography>
        )}
      </Box>

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
                Seu progresso
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {pontosObtidos.toFixed(1)} / {totalPontos.toFixed(1)}{' '}
                <Typography component="span" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.8rem' }}>
                  ({progressoPct}%)
                </Typography>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {isFechada && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Esta atividade está encerrada. O envio de novas submissões está desabilitado, mas você ainda pode visualizar seu histórico.
        </Alert>
      )}

      {/* Functions section */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', mb: 0.4 }}>
          Funções da atividade
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Clique em uma função para ver os detalhes e enviar sua solução.
        </Typography>
      </Box>

      {funcoes.length === 0 ? (
        <Alert severity="info" variant="outlined">
          Nenhum exercício disponível nesta atividade.
        </Alert>
      ) : (
        <Box>
          {funcoes.map((funcao, idx) => {
            const prog = progresso.find((p) => p.funcaoUuid === funcao.uuid);
            return (
              <FuncaoRow
                key={funcao.uuid}
                funcao={funcao}
                prog={prog}
                uuid={uuid}
                isFechada={isFechada}
                isLast={idx === funcoes.length - 1}
                navigate={navigate}
              />
            );
          })}
        </Box>
      )}

      {/* Bottom note */}
      {funcoes.length > 0 && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            backgroundColor: (theme) =>
              theme.palette.mode === 'light' ? '#eff6ff' : 'rgba(59,130,246,0.1)',
            border: '1px solid',
            borderColor: (theme) =>
              theme.palette.mode === 'light' ? '#bfdbfe' : 'rgba(59,130,246,0.2)',
            display: 'flex',
            gap: 1.5,
            alignItems: 'flex-start',
          }}
        >
          <InfoOutlinedIcon sx={{ fontSize: 18, color: '#3b82f6', flexShrink: 0, mt: 0.1 }} />
          <Typography variant="caption" sx={{ color: '#1d4ed8', lineHeight: 1.5, fontSize: '0.8rem' }}>
            Cada função possui suas próprias tentativas e pontuação.
            A nota final da atividade é a soma das notas de todas as funções.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

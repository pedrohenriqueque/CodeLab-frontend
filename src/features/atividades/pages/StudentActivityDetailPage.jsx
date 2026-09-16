/**
 * StudentActivityDetailPage — detalhe de atividade para o aluno.
 *
 * Exibe metadados da atividade, progresso consolidado, lista de funções com status
 * detalhado por função e ação de Entrega Final da Atividade (RN14).
 */

import { useState } from 'react';
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import SendIcon from '@mui/icons-material/Send';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

import useAtividadeDetail from '../hooks/useAtividadeDetail';
import useProgresso from '../hooks/useProgresso';
import { entregarAtividade } from '../api';
import { useAuth } from '../../auth/hooks/useAuthProvider';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function deriveFuncaoStatus(prog, funcao) {
  const pontosMax = funcao.peso ?? funcao.pontos ?? 10;
  if (!prog || prog.tentativasUsadas === 0) return 'nao_iniciada';
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
  return <RadioButtonUncheckedIcon sx={{ fontSize: 22, color: '#d1d5db' }} />;
}

// ─── Function Row ────────────────────────────────────────────────────────────

function FuncaoRow({ funcao, prog, uuid, isLast, navigate }) {
  const targetFuncUuid = funcao.funcaoUuid || funcao.uuid;
  const tentativas = prog?.tentativasUsadas ?? 0;
  const melhorNota = prog?.melhorNota ?? 0;
  const status = deriveFuncaoStatus(prog, funcao);
  const pontosMax = funcao.peso ?? funcao.pontos ?? 10;
  const numCasos = funcao.casosTeste?.length ?? 0;

  const statusChip = {
    concluida: { label: 'Concluída', bgcolor: '#dcfce7', color: '#15803d' },
    em_andamento: {
      label: `${tentativas} tentativa${tentativas > 1 ? 's' : ''}`,
      bgcolor: '#fef3c7',
      color: '#b45309',
    },
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
  const { showSuccess, showError } = useSnackbar();

  const { atividade, loading, error, refetch } = useAtividadeDetail(uuid);
  const { progresso, refetch: refetchProgresso } = useProgresso(user?.uuid);

  const [entregarDialogOpen, setEntregarDialogOpen] = useState(false);
  const [entregando, setEntregando] = useState(false);

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

  const isEntregue = atividade.statusEntrega === 'entregue';

  const funcoes = atividade.funcoes ?? [];
  const totalPontos = funcoes.reduce((s, f) => s + (f.peso ?? f.pontos ?? 10), 0);

  let pontosObtidos = 0;
  let funcoesConcluidas = 0;
  for (const f of funcoes) {
    const targetFuncUuid = f.funcaoUuid || f.uuid;
    const prog = progresso.find((p) => p.funcaoUuid === targetFuncUuid);
    const pesoFunc = f.peso ?? f.pontos ?? 10;
    if (prog && prog.tentativasUsadas > 0) {
      pontosObtidos += prog.melhorNota;
      if (prog.melhorNota >= pesoFunc) funcoesConcluidas++;
    }
  }

  const progressoPct = funcoes.length > 0
    ? Math.round((funcoesConcluidas / funcoes.length) * 100)
    : 0;

  const handleConfirmarEntrega = async () => {
    setEntregando(true);
    try {
      const resp = await entregarAtividade(uuid);
      showSuccess(`Atividade entregue com sucesso! Nota consolidada: ${resp.notaFinal ?? pontosObtidos} pts`);
      setEntregarDialogOpen(false);
      refetch();
      refetchProgresso();
    } catch (err) {
      showError(err.response?.data?.detail || 'Erro ao realizar a entrega da atividade.');
    } finally {
      setEntregando(false);
    }
  };

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

      {/* Header com Título e Botão de Entrega */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {atividade.titulo}
            </Typography>
            {isEntregue ? (
              <Chip
                icon={<TaskAltIcon fontSize="small" />}
                label="Entregue"
                color="success"
                size="small"
                variant="outlined"
              />
            ) : isFechada ? (
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

        {/* Botão de Entrega no Topo */}
        {!isEntregue && !isFechada && (
          <Button
            id="btn-entregar-atividade"
            variant="contained"
            color="success"
            startIcon={<SendIcon />}
            onClick={() => setEntregarDialogOpen(true)}
            sx={{ fontWeight: 600, px: 2.5 }}
          >
            Entregar Atividade
          </Button>
        )}
      </Box>

      {/* Alerta de Atividade Entregue */}
      {isEntregue && (
        <Alert severity="success" icon={<TaskAltIcon />} sx={{ mb: 3, borderRadius: 2 }}>
          Você já realizou a <strong>entrega final</strong> desta atividade. Suas submissões foram consolidadas e novas tentativas estão desabilitadas.
        </Alert>
      )}

      {/* Alerta de Atividade Encerrada por Prazo */}
      {isFechada && !isEntregue && (
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

            {/* Progresso / Nota */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.4, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {isEntregue ? 'Nota Consolidada' : 'Seu progresso'}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.9rem', color: isEntregue ? 'success.main' : 'text.primary' }}>
                {pontosObtidos.toFixed(1)} / {totalPontos.toFixed(1)}{' '}
                <Typography component="span" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.8rem' }}>
                  ({progressoPct}%)
                </Typography>
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
              />
            );
          })}
        </Card>
      )}

      {/* Bottom delivery banner */}
      {!isEntregue && !isFechada && funcoes.length > 0 && (
        <Box
          sx={{
            mt: 3,
            p: 2.5,
            borderRadius: 2,
            backgroundColor: (theme) =>
              theme.palette.mode === 'light' ? '#f8fafc' : 'rgba(255,255,255,0.03)',
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <InfoOutlinedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Pronto para encerrar?
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Após concluir as funções desejadas, realize a entrega final para consolidar suas notas.
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            color="success"
            startIcon={<SendIcon />}
            onClick={() => setEntregarDialogOpen(true)}
            sx={{ fontWeight: 600 }}
          >
            Entregar Atividade
          </Button>
        </Box>
      )}

      {/* Modal de Confirmação de Entrega Final (RN14) */}
      <Dialog
        open={entregarDialogOpen}
        onClose={() => !entregando && setEntregarDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Entregar atividade?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Após a entrega, você <strong>não poderá realizar novas submissões</strong> nesta atividade.
          </Typography>

          <Box sx={{ p: 2, borderRadius: 2, backgroundColor: 'action.hover', mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Funções concluídas:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{funcoesConcluidas} de {funcoes.length}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Nota consolidada prevista:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                {pontosObtidos.toFixed(1)} / {totalPontos.toFixed(1)} pts
              </Typography>
            </Box>
          </Box>

          <Typography variant="caption" color="text.secondary">
            Suas melhores notas em cada função serão consolidadas como a nota final da atividade.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEntregarDialogOpen(false)} disabled={entregando}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleConfirmarEntrega}
            disabled={entregando}
            startIcon={<SendIcon />}
          >
            {entregando ? 'Entregando...' : 'Entregar atividade'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

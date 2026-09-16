/**
 * StudentDashboardPage — Painel inicial do aluno.
 *
 * Exibe: atividades em andamento, últimas tentativas,
 * próximos prazos e resumo geral.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Skeleton,
  Alert,
  Divider,
  Button,
} from '@mui/material';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';

import { dashboardApi } from '../api';
import { useAuth } from '../../auth/hooks/useAuthProvider';

// ─── helpers ────────────────────────────────────────────────────────────────

function getFirstName(nome = '') {
  return nome.split(' ')[0];
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function formatDatetime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) +
    ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function getStatusInfo(status, nota, pontosMax) {
  if (status === 'avaliado') {
    if (nota !== null && nota >= pontosMax * 0.7) {
      return { label: 'Aprovada', color: 'success' };
    }
    return { label: 'Parcial', color: 'warning' };
  }
  if (status === 'erro') return { label: 'Erro', color: 'error' };
  if (status === 'pendente' || status === 'compilando' || status === 'executando') {
    return { label: 'Avaliando', color: 'info' };
  }
  return { label: status, color: 'default' };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatItem({ value, label }) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography
        sx={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.1, color: 'text.primary' }}
      >
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
        {label}
      </Typography>
    </Box>
  );
}

function ActivityCard({ atv, onNavigate }) {
  const pct = atv.progresso_percent ?? 0;

  return (
    <Box
      onClick={() => onNavigate(`/aluno/atividades/${atv.uuid}`)}
      sx={{
        cursor: 'pointer',
        borderRadius: 2,
        p: 0.5,
        mx: -0.5,
        transition: 'background 0.15s',
        '&:hover': { backgroundColor: 'action.hover' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <Box
          sx={{
            width: 36, height: 36, borderRadius: 2, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#3B82F620',
          }}
        >
          <AssignmentOutlinedIcon sx={{ fontSize: 18, color: '#3B82F6' }} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {atv.titulo}
            </Typography>
            <Chip
              label="Em andamento"
              size="small"
              sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 600, flexShrink: 0 }}
            />
          </Box>

          {atv.descricao && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                mb: 0.75,
                fontSize: '0.78rem',
              }}
            >
              {atv.descricao}
            </Typography>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
            <AccessTimeIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {atv.data_fechamento
                ? `Prazo: ${formatDate(atv.data_fechamento)}`
                : 'Sem prazo definido'}
            </Typography>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                Seu progresso
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {atv.funcoes_completas}/{atv.total_funcoes} funções
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={pct}
              sx={{ height: 5, borderRadius: 3, backgroundColor: '#E4E7EC' }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const resp = await dashboardApi.getDashboardAluno();
        setData(resp);
      } catch (err) {
        setError('Erro ao carregar painel. Tente novamente.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const firstName = getFirstName(user?.nome ?? '');

  return (
    <Box sx={{ animation: 'fadeIn 0.35s ease-out' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 0.5 }}>
          Olá, {firstName}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Continue seus estudos e acompanhe suas atividades.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* ── Main grid ───────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' },
          gap: 2.5,
          alignItems: 'start',
        }}
      >
        {/* ── LEFT: Atividades em andamento + Próximos prazos ─────────── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* Atividades em andamento */}
          <Card>
            <CardContent sx={{ pb: '16px !important' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                  Atividades em andamento
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'primary.main', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem', '&:hover': { textDecoration: 'underline' } }}
                  onClick={() => navigate('/aluno/atividades')}
                >
                  Ver todas
                </Typography>
              </Box>

              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 2.5, alignItems: 'flex-start' }}>
                    <Skeleton variant="rounded" width={36} height={36} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="65%" />
                      <Skeleton variant="text" width="45%" />
                      <Skeleton variant="rounded" height={5} sx={{ mt: 1 }} />
                    </Box>
                  </Box>
                ))
              ) : data?.atividades_em_andamento?.length ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {data.atividades_em_andamento.map((atv) => (
                    <ActivityCard key={atv.uuid} atv={atv} onNavigate={navigate} />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Nenhuma atividade em andamento no momento.
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Próximos prazos */}
          <Card>
            <CardContent sx={{ pb: '16px !important' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', mb: 2 }}>
                Próximos prazos
              </Typography>

              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'center' }}>
                    <Skeleton variant="circular" width={14} height={14} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                    </Box>
                  </Box>
                ))
              ) : data?.proximos_prazos?.length ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {data.proximos_prazos.map((atv) => {
                    const urgent = atv.dias_restantes !== null && atv.dias_restantes <= 3;
                    const color = urgent ? '#ef4444' : '#22c55e';
                    const diasLabel = atv.dias_restantes === 0
                      ? 'Vence hoje'
                      : atv.dias_restantes === 1
                        ? 'Vence amanhã'
                        : `Vence em ${atv.dias_restantes} dias`;

                    return (
                      <Box
                        key={atv.uuid}
                        onClick={() => navigate(`/aluno/atividades/${atv.uuid}`)}
                        sx={{
                          display: 'flex', alignItems: 'flex-start', gap: 1.5,
                          cursor: 'pointer', borderRadius: 2, p: 0.5, mx: -0.5,
                          transition: 'background 0.15s', '&:hover': { backgroundColor: 'action.hover' },
                        }}
                      >
                        {urgent
                          ? <RadioButtonUncheckedIcon sx={{ fontSize: 14, color, mt: 0.3, flexShrink: 0 }} />
                          : <CheckCircleOutlineRoundedIcon sx={{ fontSize: 14, color, mt: 0.3, flexShrink: 0 }} />
                        }
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {atv.titulo}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" sx={{ color, fontWeight: 600, fontSize: '0.75rem' }}>
                              {diasLabel}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              · Prazo: {formatDate(atv.data_fechamento)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  Nenhum prazo próximo.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* ── RIGHT: Últimas tentativas + Resumo ──────────────────────── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* Últimas tentativas */}
          <Card>
            <CardContent sx={{ pb: '16px !important' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', mb: 2 }}>
                Minhas últimas tentativas
              </Typography>

              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Box key={i} sx={{ mb: 2 }}>
                    <Skeleton variant="text" width="70%" />
                    <Skeleton variant="text" width="55%" />
                    <Divider sx={{ mt: 1 }} />
                  </Box>
                ))
              ) : data?.ultimas_tentativas?.length ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {data.ultimas_tentativas.map((tent, idx) => {
                    const statusInfo = getStatusInfo(tent.status, tent.nota, tent.pontos_max);
                    const notaStr = tent.nota !== null
                      ? `${tent.nota.toFixed(1)} / ${tent.pontos_max.toFixed(1)}`
                      : '— ';

                    return (
                      <Box key={tent.uuid}>
                        <Box
                          sx={{
                            py: 1.5, display: 'flex', justifyContent: 'space-between',
                            alignItems: 'flex-start', gap: 1,
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            >
                              {tent.funcao_nome}()
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                {tent.atividade_titulo} · {formatDatetime(tent.data)}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' }}>
                              {notaStr}
                            </Typography>
                            <Chip
                              label={statusInfo.label}
                              color={statusInfo.color}
                              size="small"
                              sx={{ fontSize: '0.65rem', height: 18, mt: 0.3 }}
                            />
                          </Box>
                        </Box>
                        {idx < data.ultimas_tentativas.length - 1 && <Divider />}
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  Nenhuma tentativa realizada ainda.
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Resumo geral */}
          <Card>
            <CardContent sx={{ pb: '16px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <EmojiEventsOutlinedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                  Resumo geral
                </Typography>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                  {[1, 2, 3].map((i) => (
                    <Box key={i} sx={{ textAlign: 'center' }}>
                      <Skeleton variant="text" width={48} sx={{ mx: 'auto', fontSize: '2rem' }} />
                      <Skeleton variant="text" width={60} sx={{ mx: 'auto' }} />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    py: 1,
                    gap: 1,
                  }}
                >
                  <StatItem
                    value={data?.resumo?.total_atividades ?? 0}
                    label="atividades"
                  />
                  <Divider orientation="vertical" flexItem />
                  <StatItem
                    value={data?.resumo?.melhor_nota != null
                      ? `${data.resumo.melhor_nota.toFixed(1).replace('.', ',')} / 10`
                      : '—'}
                    label="melhor nota"
                  />
                  <Divider orientation="vertical" flexItem />
                  <StatItem
                    value={data?.resumo?.total_tentativas ?? 0}
                    label="tentativas realizadas"
                  />
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Button
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/aluno/historico')}
                sx={{ fontSize: '0.8rem', fontWeight: 600 }}
              >
                Ver histórico completo
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}

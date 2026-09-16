/**
 * DashboardPage — Painel do professor.
 *
 * Exibe: cards de estatísticas, atividades recentes e gráfico de desempenho semanal.
 * Dados consumidos diretamente do endpoint /api/dashboard/estatisticas.
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Skeleton,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  CartesianGrid,
} from 'recharts';

import { dashboardApi } from '../api';
import { useAuth } from '../../auth/hooks/useAuthProvider';

// ─── helpers ────────────────────────────────────────────────────────────────

function getFirstName(nome = '') {
  return nome.split(' ')[0];
}

function formatDate(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function StatusBadge({ status }) {
  const map = {
    publicado: { label: 'Ativa', color: '#22c55e', bg: '#dcfce7' },
    rascunho:  { label: 'Rascunho', color: '#f59e0b', bg: '#fef3c7' },
    fechado:   { label: 'Encerrada', color: '#ef4444', bg: '#fee2e2' },
  };
  const cfg = map[status] ?? { label: status, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: 1.25,
        py: 0.35,
        borderRadius: '6px',
        fontSize: '0.7rem',
        fontWeight: 700,
        letterSpacing: '0.02em',
        color: cfg.color,
        backgroundColor: cfg.bg,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {cfg.label}
    </Box>
  );
}

function ActivityIcon({ status }) {
  const colors = {
    publicado: '#3b82f6',
    rascunho:  '#f59e0b',
    fechado:   '#ef4444',
  };
  return (
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: `${colors[status] ?? '#6b7280'}20`,
        flexShrink: 0,
      }}
    >
      <AssignmentIcon sx={{ fontSize: 18, color: colors[status] ?? '#6b7280' }} />
    </Box>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ value, label, loading }) {
  return (
    <Card sx={{ flex: 1, minWidth: 0 }}>
      <CardContent sx={{ textAlign: 'center', py: 3, px: 2 }}>
        {loading ? (
          <>
            <Skeleton variant="text" width="50%" sx={{ mx: 'auto', mb: 1, fontSize: '2.5rem' }} />
            <Skeleton variant="text" width="70%" sx={{ mx: 'auto' }} />
          </>
        ) : (
          <>
            <Typography
              sx={{
                fontSize: '2.4rem',
                fontWeight: 800,
                lineHeight: 1.1,
                color: 'text.primary',
                letterSpacing: '-0.03em',
              }}
            >
              {value}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.75, lineHeight: 1.3, fontSize: '0.82rem' }}
            >
              {label}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Custom Tooltip do gráfico ────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <Box
        sx={{
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1.5,
          px: 1.5,
          py: 1,
          boxShadow: 3,
        }}
      >
        <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
        <Typography variant="body2" fontWeight={700} color="primary.main">
          {val !== null && val !== undefined ? val.toFixed(1) : '—'}
        </Typography>
      </Box>
    );
  }
  return null;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await dashboardApi.getEstatisticas();
        setStats(data);
      } catch (err) {
        setError('Erro ao carregar estatísticas do dashboard.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const firstName = getFirstName(user?.nome ?? '');

  // Preparar dados do gráfico (substituir null por undefined para recharts não plotar)
  const chartData = stats?.desempenho_semanal?.map((s) => ({
    semana: s.semana,
    media: s.media ?? undefined,
  })) ?? [];

  return (
    <Box sx={{ animation: 'fadeIn 0.35s ease-out' }}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          mb: 3,
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Olá, Professor {firstName}! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Aqui está um resumo das suas atividades.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexShrink: 0, alignSelf: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/funcoes')}
          >
            Biblioteca de Funções
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/atividades/criar')}
          >
            Nova atividade
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* ── Stat Cards ──────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 3,
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
        }}
      >
        <StatCard
          loading={loading}
          value={stats?.atividades_ativas ?? 0}
          label="Atividades ativas"
        />
        <StatCard
          loading={loading}
          value={stats?.rascunhos ?? 0}
          label="Rascunhos"
        />
        <StatCard
          loading={loading}
          value={stats?.submissoes_semana ?? 0}
          label={<>Submissões<br />esta semana</>}
        />
        <StatCard
          loading={loading}
          value={
            stats?.media_geral_turma != null
              ? stats.media_geral_turma.toFixed(1).replace('.', ',')
              : '—'
          }
          label={<>Média geral<br />da turma</>}
        />
      </Box>

      {/* ── Bottom section ──────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flexWrap: { xs: 'wrap', lg: 'nowrap' },
          alignItems: 'stretch',
        }}
      >
        {/* ── Atividades Recentes ─────────────────────────────────── */}
        <Card sx={{ flex: '1 1 340px', minWidth: 0 }}>
          <CardContent sx={{ pb: '16px !important' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2.5,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                Atividades recentes
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'primary.main',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  '&:hover': { textDecoration: 'underline' },
                }}
                onClick={() => navigate('/atividades')}
              >
                Ver todas
              </Typography>
            </Box>

            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 2.5, alignItems: 'flex-start' }}>
                  <Skeleton variant="rounded" width={36} height={36} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="70%" />
                    <Skeleton variant="text" width="55%" />
                  </Box>
                </Box>
              ))
            ) : stats?.atividades_recentes?.length ? (
              stats.atividades_recentes.map((atv, idx) => {
                const dataFmt = formatDate(atv.data_fechamento);
                const diasLabel =
                  atv.dias_para_fechar != null
                    ? atv.dias_para_fechar < 0
                      ? `Encerrada em ${dataFmt}`
                      : `Entrega em ${atv.dias_para_fechar} dia${atv.dias_para_fechar !== 1 ? 's' : ''} • ${dataFmt}`
                    : dataFmt ?? '';

                return (
                  <Box
                    key={atv.uuid}
                    sx={{
                      display: 'flex',
                      gap: 1.5,
                      alignItems: 'flex-start',
                      mb: idx < stats.atividades_recentes.length - 1 ? 2.5 : 0,
                      cursor: 'pointer',
                      borderRadius: 2,
                      p: 0.5,
                      mx: -0.5,
                      transition: 'background 0.15s',
                      '&:hover': { backgroundColor: 'action.hover' },
                    }}
                    onClick={() => navigate(`/atividades/${atv.uuid}`)}
                  >
                    <ActivityIcon status={atv.status} />

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1,
                          mb: 0.4,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {atv.titulo}
                        </Typography>
                        <StatusBadge status={atv.status} />
                      </Box>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: '0.75rem' }}
                      >
                        {diasLabel}
                        {atv.total_submissoes > 0 && (
                          <> &nbsp;·&nbsp; {atv.total_submissoes} {atv.total_submissoes === 1 ? 'entrega' : 'entregas'}</>
                        )}
                      </Typography>
                    </Box>
                  </Box>
                );
              })
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                Nenhuma atividade criada ainda.
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* ── Desempenho da turma ─────────────────────────────────── */}
        <Card sx={{ flex: '1 1 300px', minWidth: 0 }}>
          <CardContent sx={{ pb: '16px !important' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', mb: 0.5 }}>
              Desempenho da turma
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2.5 }}>
              Média das últimas 4 semanas
            </Typography>

            {loading ? (
              <Skeleton variant="rounded" height={200} />
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMedia" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1565C0" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#1565C0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EC" vertical={false} />
                  <XAxis
                    dataKey="semana"
                    tick={{ fontSize: 11, fill: '#5E6C84' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 10]}
                    ticks={[0, 2.5, 5, 7.5, 10]}
                    tick={{ fontSize: 11, fill: '#5E6C84' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="media"
                    stroke="#1565C0"
                    strokeWidth={2.5}
                    fill="url(#colorMedia)"
                    dot={{ r: 4, fill: '#1565C0', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#1565C0', strokeWidth: 0 }}
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {!loading && chartData.every((d) => d.media === undefined) && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: 'center', mt: -10, pb: 6 }}
              >
                Sem dados de desempenho ainda.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

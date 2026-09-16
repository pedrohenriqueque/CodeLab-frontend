/**
 * StudentActivityListPage — lista de atividades para o aluno.
 *
 * Exibe atividades como linhas de lista com score, status, busca e filtro.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  InputAdornment,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Chip,
  LinearProgress,
  Skeleton,
  Alert,
  Divider,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';

import useAtividades from '../../atividades/hooks/useAtividades';
import useProgresso from '../../atividades/hooks/useProgresso';
import { useAuth } from '../../auth/hooks/useAuthProvider';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function deriveStudentStatus(atv, funcoes, progresso) {
  if (atv.statusEntrega === 'entregue') return 'entregue';
  const total = funcoes?.length ?? 0;
  if (total === 0) return 'nao_iniciado';

  let enviadas = 0;
  let completas = 0;

  for (const f of (funcoes || [])) {
    const fUuid = f.funcaoUuid || f.uuid;
    const prog = progresso.find((p) => p.funcaoUuid === fUuid);
    const peso = f.peso ?? f.pontos ?? 10;
    if (prog && prog.tentativasUsadas > 0) {
      enviadas++;
      if (prog.melhorNota >= peso) completas++;
    }
  }

  if (enviadas === 0) return 'nao_iniciado';
  if (completas === total) return 'concluido';
  return 'em_andamento';
}

const STATUS_MAP = {
  entregue:     { label: 'Entregue',     bgcolor: '#dcfce7', color: '#15803d' },
  concluido:    { label: 'Concluído',    bgcolor: '#dcfce7', color: '#15803d' },
  em_andamento: { label: 'Em andamento', bgcolor: '#dbeafe', color: '#1d4ed8' },
  nao_iniciado: { label: 'Não iniciado', bgcolor: '#f3f4f6', color: '#6b7280' },
};

const FILTER_OPTIONS = [
  { value: 'todas',        label: 'Todas as atividades' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'entregue',     label: 'Entregues' },
  { value: 'nao_iniciado', label: 'Não iniciadas' },
];

// ─── Activity Row ────────────────────────────────────────────────────────────

function ActivityRow({ atv, progresso, onNavigate, isLast }) {
  const total = atv.funcoes?.length ?? 0;
  const totalPontos = atv.funcoes?.reduce((s, f) => s + (f.peso ?? f.pontos ?? 10), 0) ?? 0;

  let pontosObtidos = 0;
  let funcoesConcluidas = 0;
  for (const f of (atv.funcoes || [])) {
    const fUuid = f.funcaoUuid || f.uuid;
    const prog = progresso.find((p) => p.funcaoUuid === fUuid);
    const peso = f.peso ?? f.pontos ?? 10;
    if (prog && prog.tentativasUsadas > 0) {
      pontosObtidos += prog.melhorNota;
      if (prog.melhorNota >= peso) funcoesConcluidas++;
    }
  }

  const studentStatus = deriveStudentStatus(atv, atv.funcoes, progresso);
  const statusCfg = STATUS_MAP[studentStatus] || STATUS_MAP.nao_iniciado;
  const progressoPct = total > 0 ? (funcoesConcluidas / total) * 100 : 0;

  return (
    <>
      <Box
        onClick={() => onNavigate(`/aluno/atividades/${atv.uuid}`)}
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
        {/* Main info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body1"
            sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {atv.titulo}
          </Typography>

          {atv.descricao && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                fontSize: '0.8rem',
                mb: 0.5,
              }}
            >
              {atv.descricao}
            </Typography>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarTodayOutlinedIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {formatDate(atv.dataAbertura)} — {formatDate(atv.dataFechamento)}
            </Typography>
          </Box>

          {/* Progress bar (only if started) */}
          {studentStatus !== 'nao_iniciado' && (
            <Box sx={{ mt: 0.75 }}>
              <LinearProgress
                variant="determinate"
                value={progressoPct}
                sx={{ height: 4, borderRadius: 3, backgroundColor: '#E4E7EC' }}
              />
            </Box>
          )}
        </Box>

        {/* Score + status */}
        <Box sx={{ textAlign: 'right', flexShrink: 0, minWidth: 120 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '1rem', color: 'text.primary', mb: 0.5 }}>
            {pontosObtidos.toFixed(1)}{' '}
            <Typography component="span" sx={{ fontWeight: 400, color: 'text.secondary', fontSize: '0.875rem' }}>
              / {totalPontos.toFixed(1)}
            </Typography>
          </Typography>
          <Chip
            label={statusCfg.label}
            size="small"
            sx={{
              bgcolor: statusCfg.bgcolor,
              color: statusCfg.color,
              fontWeight: 600,
              fontSize: '0.7rem',
              height: 22,
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

export default function StudentActivityListPage() {
  const { user } = useAuth();
  const { atividades, loading, error } = useAtividades();
  const { progresso } = useProgresso(user?.uuid);
  const [filter, setFilter] = useState('todas');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    let result = atividades.filter((a) => a.status !== 'rascunho');

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.titulo?.toLowerCase().includes(q) ||
          a.descricao?.toLowerCase().includes(q),
      );
    }

    if (filter !== 'todas') {
      result = result.filter(
        (a) => deriveStudentStatus(a, a.funcoes, progresso) === filter,
      );
    }

    return result;
  }, [atividades, progresso, filter, search]);

  return (
    <Box className="fade-in">
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 0.5 }}>Atividades</Typography>
        <Typography variant="body1" color="text.secondary">
          Veja todas as atividades disponíveis para você.
        </Typography>
      </Box>

      {/* Search + Filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            displayEmpty
            sx={{ borderRadius: 2 }}
          >
            {FILTER_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size="small"
          placeholder="Buscar atividade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* List */}
      {loading ? (
        <Box>
          {[1, 2, 3, 4].map((i) => (
            <Box key={i}>
              <Box sx={{ py: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="55%" height={22} />
                  <Skeleton variant="text" width="75%" height={16} />
                  <Skeleton variant="text" width="40%" height={14} />
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Skeleton variant="text" width={80} height={22} />
                  <Skeleton variant="rounded" width={90} height={22} sx={{ mt: 0.5 }} />
                </Box>
              </Box>
              {i < 4 && <Divider />}
            </Box>
          ))}
        </Box>
      ) : filtered.length === 0 ? (
        <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
          {search
            ? 'Nenhuma atividade encontrada para sua busca.'
            : 'Nenhuma atividade disponível no momento.'}
        </Alert>
      ) : (
        <Box>
          {filtered.map((atv, idx) => (
            <ActivityRow
              key={atv.uuid}
              atv={atv}
              progresso={progresso}
              onNavigate={navigate}
              isLast={idx === filtered.length - 1}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

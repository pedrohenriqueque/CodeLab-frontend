/**
 * StudentActivityListPage — lista de atividades para o aluno.
 *
 * Cards com título, status, período e progresso.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  Alert,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

import useAtividades from '../../atividades/hooks/useAtividades';
import useProgresso from '../../atividades/hooks/useProgresso';

const STATUS_MAP = {
  publicado: { label: 'Aberta', color: 'success' },
  fechado: { label: 'Fechada', color: 'default' },
  rascunho: { label: 'Rascunho', color: 'warning' },
};

function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function StudentActivityListPage() {
  const { atividades, loading, error } = useAtividades();
  const { progresso } = useProgresso();
  const [filter, setFilter] = useState('todas');
  const navigate = useNavigate();

  // Aluno só vê atividades publicadas/fechadas
  const filteredAtividades = useMemo(() => {
    let result = atividades.filter((a) => a.status !== 'rascunho');

    if (filter === 'abertas') {
      result = result.filter((a) => a.status === 'publicado');
    } else if (filter === 'fechadas') {
      result = result.filter((a) => a.status === 'fechado');
    }

    return result;
  }, [atividades, filter]);

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">Atividades Disponíveis</Typography>
        <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
          Escolha uma atividade para ver os exercícios e submeter seu código
        </Typography>
      </Box>

      {/* Filtro */}
      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={(_, val) => val && setFilter(val)}
        size="small"
        sx={{ mb: 3 }}
      >
        <ToggleButton value="todas">Todas</ToggleButton>
        <ToggleButton value="abertas">Em Andamento</ToggleButton>
        <ToggleButton value="fechadas">Finalizadas</ToggleButton>
      </ToggleButtonGroup>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={200} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
      ) : filteredAtividades.length === 0 ? (
        <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
          Nenhuma atividade disponível no momento.
        </Alert>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
            gap: 2.5,
          }}
        >
          {filteredAtividades.map((atv) => {
            const status = STATUS_MAP[atv.status] || STATUS_MAP.publicado;
            const totalFuncoes = atv.funcoes?.length || 0;
            
            // Calculate progress based on real functions
            let completedFuncoes = 0;
            if (atv.funcoes) {
              completedFuncoes = atv.funcoes.filter(f => {
                const p = progresso.find(pr => pr.funcaoUuid === f.uuid);
                return p && p.melhorNota >= f.pontos;
              }).length;
            }
            
            const progressoPercent = totalFuncoes > 0 ? (completedFuncoes / totalFuncoes) * 100 : 0;

            return (
              <Card
                key={atv.uuid}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  },
                  transition: 'all 0.2s ease',
                }}
                onClick={() => navigate(`/aluno/atividades/${atv.uuid}`)}
              >
                <CardContent sx={{ pb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Typography variant="h6" sx={{ fontSize: '1.05rem' }}>
                      {atv.titulo}
                    </Typography>
                    <Chip label={status.label} color={status.color} size="small" variant="outlined" />
                  </Box>

                  {atv.descricao && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {atv.descricao}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                    <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(atv.dataAbertura)} — {formatDate(atv.dataFechamento)}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 0.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Progresso
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {completedFuncoes}/{totalFuncoes} funções
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={progressoPercent}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    fullWidth
                    variant="outlined"
                  >
                    Ver Detalhes
                  </Button>
                </CardActions>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

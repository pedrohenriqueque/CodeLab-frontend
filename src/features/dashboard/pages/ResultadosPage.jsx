import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  LinearProgress,
  Alert,
  Skeleton,
  Select,
  MenuItem,
  FormControl,
  alpha,
  useTheme,
  Button,
} from '@mui/material';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SwapVertRoundedIcon from '@mui/icons-material/SwapVertRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import RefreshIcon from '@mui/icons-material/Refresh';

import { getResultadosTurma } from '../../turmas/api';
import { getAtividadesResumo } from '../../atividades/api';
import { useTurmaContext } from '../../turmas/context/TurmaContext';

// SVG personalizado para documento com checkmark (Card 2)
function DocumentCheckIcon({ size = 26, color = 'currentColor', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  );
}

// SVG personalizado para documento com X (Card 3)
function DocumentXIcon({ size = 26, color = 'currentColor', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9.5" y1="12.5" x2="14.5" y2="17.5" />
      <line x1="14.5" y1="12.5" x2="9.5" y2="17.5" />
    </svg>
  );
}

// Formatação segura de datas no padrão pt-BR (DD/MM/AAAA)
function formatarPrazo(dataValor) {
  if (!dataValor) return 'Sem prazo definido';
  try {
    const data = new Date(dataValor);
    if (isNaN(data.getTime())) return 'Sem prazo definido';
    return `Fecha em ${data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })}`;
  } catch {
    return 'Sem prazo definido';
  }
}

function percentualEnvio(enviados, totalAlunos) {
  const tot = Number(totalAlunos) || 0;
  const env = Number(enviados) || 0;
  return tot > 0 ? Math.min((env / tot) * 100, 100) : 0;
}

export default function ResultadosPage() {
  const theme = useTheme();
  const { turmaAtiva } = useTurmaContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultados, setResultados] = useState(null);
  const [atividadesMeta, setAtividadesMeta] = useState(new Map());

  // Critérios de ordenação
  const [criterioAtivo, setCriterioAtivo] = useState('participacao');
  const [ordenacaoParticipacao, setOrdenacaoParticipacao] = useState('menor');
  const [ordenacaoPrazo, setOrdenacaoPrazo] = useState('proximo');

  const turmaUuid = turmaAtiva?.uuid;

  const carregarDados = useCallback(() => {
    if (!turmaUuid) return;
    setLoading(true);
    setError(null);

    Promise.all([
      getResultadosTurma(turmaUuid),
      getAtividadesResumo(turmaUuid).catch(() => []),
    ])
      .then(([resData, ativList]) => {
        const metaMap = new Map();
        (ativList || []).forEach((item) => {
          metaMap.set(item.uuid, item);
        });
        setResultados(resData);
        setAtividadesMeta(metaMap);
      })
      .catch((err) => {
        setError(err.response?.data?.erro || 'Não foi possível carregar os resultados da turma.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [turmaUuid]);

  useEffect(() => {
    let ativo = true;
    if (!turmaUuid) return;

    // Dispara carregamento assíncrono
    Promise.resolve().then(() => {
      if (!ativo) return;
      setLoading(true);
      setError(null);
    });

    Promise.all([
      getResultadosTurma(turmaUuid),
      getAtividadesResumo(turmaUuid).catch(() => []),
    ])
      .then(([resData, ativList]) => {
        if (!ativo) return;
        const metaMap = new Map();
        (ativList || []).forEach((item) => {
          metaMap.set(item.uuid, item);
        });
        setResultados(resData);
        setAtividadesMeta(metaMap);
      })
      .catch((err) => {
        if (!ativo) return;
        setError(err.response?.data?.erro || 'Não foi possível carregar os resultados da turma.');
      })
      .finally(() => {
        if (ativo) {
          setLoading(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, [turmaUuid]);

  // Combina dados das atividades
  const atividades = useMemo(() => {
    if (!resultados?.atividades) return [];
    return resultados.atividades.map((atv) => {
      const extra = atividadesMeta.get(atv.atividadeUuid) || {};
      const totalAlunos = Number(atv.totalAlunos) || 0;
      const enviados = Number(atv.enviados) || 0;
      const percentual = percentualEnvio(enviados, totalAlunos);

      return {
        ...atv,
        tipo: atv.tipo || extra.tipo || 'EXERCICIO',
        fimEm: atv.fimEm || extra.fimEm || extra.dataFechamento || null,
        enviados,
        totalAlunos,
        percentual,
      };
    });
  }, [resultados, atividadesMeta]);

  // Lista ordenada de atividades
  const atividadesOrdenadas = useMemo(() => {
    return [...atividades].sort((a, b) => {
      const pA = a.percentual ?? 0;
      const pB = b.percentual ?? 0;

      const dateA = a.fimEm ? new Date(a.fimEm).getTime() : Infinity;
      const dateB = b.fimEm ? new Date(b.fimEm).getTime() : Infinity;

      if (criterioAtivo === 'participacao') {
        const diff = ordenacaoParticipacao === 'menor' ? pA - pB : pB - pA;
        if (diff !== 0) return diff;
        // Desempate pelo prazo mais próximo
        return dateA - dateB;
      }

      if (criterioAtivo === 'prazo') {
        if (ordenacaoPrazo === 'alfabetico') {
          return a.titulo.localeCompare(b.titulo, 'pt-BR');
        }
        if (ordenacaoPrazo === 'proximo') {
          if (dateA !== dateB) return dateA - dateB;
        } else {
          const invA = a.fimEm ? new Date(a.fimEm).getTime() : -Infinity;
          const invB = b.fimEm ? new Date(b.fimEm).getTime() : -Infinity;
          if (invA !== invB) return invB - invA;
        }
        // Desempate por participação menor
        return pA - pB;
      }

      return 0;
    });
  }, [atividades, criterioAtivo, ordenacaoParticipacao, ordenacaoPrazo]);

  // Cálculos dos indicadores superiores
  const totalAtividades = atividades.length;
  const participacoesComEnvio = atividades.reduce((soma, atv) => soma + atv.enviados, 0);
  const participacoesPossiveis = atividades.reduce((soma, atv) => soma + atv.totalAlunos, 0);
  const taxaGeral = participacoesPossiveis > 0
    ? (participacoesComEnvio / participacoesPossiveis) * 100
    : 0;

  const atividadesComEnvio = atividades.filter((atv) => atv.enviados > 0).length;
  const atividadesSemEnvio = totalAtividades - atividadesComEnvio;

  if (!turmaAtiva) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 } }}>
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          Selecione uma turma para consultar os resultados.
        </Alert>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 } }}>
        <Alert
          severity="error"
          sx={{ borderRadius: 3 }}
          action={
            <Button color="inherit" size="small" onClick={carregarDados} startIcon={<RefreshIcon />}>
              Tentar novamente
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* 3 Cards de Indicadores do Topo */}
      {loading ? (
        <Grid container spacing={2.5}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={4} key={i}>
              <Skeleton variant="rounded" height={105} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2.5}>
          {/* Card 1: Participação nas atividades */}
          <Grid item xs={12} sm={4}>
            <Card
              sx={{
                p: { xs: 2, sm: 2.5 },
                height: '100%',
                borderRadius: 3.5,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: 'none',
                bgcolor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                gap: 2.25,
              }}
            >
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: 3,
                  bgcolor: theme.palette.mode === 'dark' ? alpha('#3B82F6', 0.16) : '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <GroupsOutlinedIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: 'text.secondary',
                    fontSize: '0.85rem',
                    lineHeight: 1.3,
                  }}
                >
                  Participação nas atividades
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, my: 0.35 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      color: 'text.primary',
                      fontSize: { xs: '1.45rem', sm: '1.65rem' },
                      letterSpacing: '-0.03em',
                      lineHeight: 1.1,
                    }}
                  >
                    {participacoesComEnvio} / {participacoesPossiveis}
                  </Typography>
                  <Box
                    sx={{
                      bgcolor: theme.palette.mode === 'dark' ? alpha('#3B82F6', 0.2) : '#EFF6FF',
                      color: theme.palette.mode === 'dark' ? '#60A5FA' : '#2563EB',
                      px: 1.1,
                      py: 0.3,
                      borderRadius: 999,
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      lineHeight: 1.2,
                    }}
                  >
                    {taxaGeral.toFixed(1).replace('.', ',')}%
                  </Box>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    lineHeight: 1.3,
                    display: 'block',
                  }}
                >
                  Combinações aluno × atividade com pelo menos um envio.
                </Typography>
              </Box>
            </Card>
          </Grid>

          {/* Card 2: Atividades com envio */}
          <Grid item xs={12} sm={4}>
            <Card
              sx={{
                p: { xs: 2, sm: 2.5 },
                height: '100%',
                borderRadius: 3.5,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: 'none',
                bgcolor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                gap: 2.25,
              }}
            >
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: 3,
                  bgcolor: theme.palette.mode === 'dark' ? alpha('#10B981', 0.16) : '#ECFDF5',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <DocumentCheckIcon size={26} color="#10B981" />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: 'text.secondary',
                    fontSize: '0.85rem',
                    lineHeight: 1.3,
                  }}
                >
                  Atividades com envio
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: 'text.primary',
                    fontSize: { xs: '1.45rem', sm: '1.65rem' },
                    letterSpacing: '-0.03em',
                    lineHeight: 1.1,
                    my: 0.35,
                  }}
                >
                  {atividadesComEnvio} / {totalAtividades}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    lineHeight: 1.3,
                    display: 'block',
                  }}
                >
                  Atividades publicadas com ao menos um envio.
                </Typography>
              </Box>
            </Card>
          </Grid>

          {/* Card 3: Atividades sem envio */}
          <Grid item xs={12} sm={4}>
            <Card
              sx={{
                p: { xs: 2, sm: 2.5 },
                height: '100%',
                borderRadius: 3.5,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: 'none',
                bgcolor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                gap: 2.25,
              }}
            >
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: 3,
                  bgcolor: theme.palette.mode === 'dark' ? alpha('#8B5CF6', 0.16) : '#F5F3FF',
                  color: '#8B5CF6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <DocumentXIcon size={26} color="#8B5CF6" />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: 'text.secondary',
                    fontSize: '0.85rem',
                    lineHeight: 1.3,
                  }}
                >
                  Atividades sem envio
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: 'text.primary',
                    fontSize: { xs: '1.45rem', sm: '1.65rem' },
                    letterSpacing: '-0.03em',
                    lineHeight: 1.1,
                    my: 0.35,
                  }}
                >
                  {atividadesSemEnvio}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    lineHeight: 1.3,
                    display: 'block',
                  }}
                >
                  Nenhum aluno enviou funções ainda.
                </Typography>
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Seção Principal: Envios por atividade */}
      <Card
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
          bgcolor: 'background.paper',
        }}
      >
        {/* Cabeçalho da Seção */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2,
            mb: 3,
          }}
        >
          {/* Lado Esquerdo: Título e Mensagem Informativa */}
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
              Envios por atividade
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                mt: 0.5,
              }}
            >
              <InfoOutlinedIcon
                sx={{
                  fontSize: 17,
                  color: '#3B82F6',
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.8125rem',
                }}
              >
                Acompanhe quais alunos enviaram ou não enviaram suas funções.
              </Typography>
            </Box>
          </Box>

          {/* Lado Direito: Filtros / Ordenação */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flexWrap: 'wrap',
              width: { xs: '100%', md: 'auto' },
              justifyContent: { xs: 'flex-start', md: 'flex-end' },
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '0.8125rem',
                fontWeight: 500,
                mr: 0.5,
              }}
            >
              Ordenar por
            </Typography>

            {/* Dropdown 1: Participação */}
            <FormControl size="small" sx={{ minWidth: 190 }}>
              <Select
                value={ordenacaoParticipacao}
                onChange={(e) => {
                  setOrdenacaoParticipacao(e.target.value);
                  setCriterioAtivo('participacao');
                }}
                IconComponent={KeyboardArrowDownRoundedIcon}
                sx={{
                  borderRadius: 2.5,
                  height: 38,
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  bgcolor: 'background.paper',
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    py: 0.8,
                  },
                }}
              >
                <MenuItem value="menor">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <SwapVertRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <span>Menor participação</span>
                  </Box>
                </MenuItem>
                <MenuItem value="maior">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <SwapVertRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <span>Maior participação</span>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            {/* Dropdown 2: Prazo */}
            <FormControl size="small" sx={{ minWidth: 190 }}>
              <Select
                value={ordenacaoPrazo}
                onChange={(e) => {
                  setOrdenacaoPrazo(e.target.value);
                  setCriterioAtivo('prazo');
                }}
                IconComponent={KeyboardArrowDownRoundedIcon}
                sx={{
                  borderRadius: 2.5,
                  height: 38,
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  bgcolor: 'background.paper',
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    py: 0.8,
                  },
                }}
              >
                <MenuItem value="proximo">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <CalendarTodayOutlinedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                    <span>Prazo mais próximo</span>
                  </Box>
                </MenuItem>
                <MenuItem value="distante">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <CalendarTodayOutlinedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                    <span>Prazo mais distante</span>
                  </Box>
                </MenuItem>
                <MenuItem value="alfabetico">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <CalendarTodayOutlinedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                    <span>Ordem alfabética</span>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Lista de Atividades */}
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rounded" height={76} sx={{ borderRadius: 3 }} />
            ))}
          </Box>
        ) : atividadesOrdenadas.length === 0 ? (
          <Box
            sx={{
              p: 6,
              textAlign: 'center',
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 3,
            }}
          >
            <DescriptionOutlinedIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              Ainda não há atividades publicadas nesta turma.
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Assim que criar ou publicar atividades para os alunos, elas aparecerão aqui.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {atividadesOrdenadas.map((atividade) => {
              const isProva = atividade.tipo === 'PROVA';
              const prazoTexto = formatarPrazo(atividade.fimEm);

              return (
                <Box
                  key={atividade.atividadeUuid}
                  sx={{
                    p: { xs: 2, sm: 2.25 },
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { xs: 'flex-start', md: 'center' },
                    justifyContent: 'space-between',
                    gap: { xs: 1.75, md: 3 },
                    transition: 'all 0.15s ease',
                    cursor: 'default',
                    '&:hover': {
                      borderColor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? alpha(theme.palette.primary.main, 0.4)
                          : alpha(theme.palette.primary.main, 0.3),
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
                    },
                  }}
                >
                  {/* Bloco 1: Ícone + Título e Metadados */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      minWidth: { md: 340, lg: 390 },
                      flexShrink: 0,
                    }}
                  >
                    {/* Ícone arredondado da atividade */}
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        bgcolor: isProva
                          ? theme.palette.mode === 'dark'
                            ? alpha('#8B5CF6', 0.18)
                            : '#F3E8FF'
                          : theme.palette.mode === 'dark'
                            ? alpha('#EF4444', 0.18)
                            : '#FEE2E2',
                        color: isProva ? '#7C3AED' : '#EF4444',
                      }}
                    >
                      {isProva ? (
                        <SchoolOutlinedIcon sx={{ fontSize: 24 }} />
                      ) : (
                        <DescriptionOutlinedIcon sx={{ fontSize: 24 }} />
                      )}
                    </Box>

                    {/* Título e Subtítulo */}
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 700,
                          color: 'text.primary',
                          fontSize: '0.9375rem',
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={atividade.titulo}
                      >
                        {atividade.titulo}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.75,
                          mt: 0.5,
                          flexWrap: 'nowrap',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            color: 'text.secondary',
                            fontSize: '0.75rem',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                        >
                          {isProva ? (
                            <SchoolOutlinedIcon sx={{ fontSize: 13, flexShrink: 0 }} />
                          ) : (
                            <DescriptionOutlinedIcon sx={{ fontSize: 13, flexShrink: 0 }} />
                          )}
                          <span>{isProva ? 'Trabalho avaliativo' : 'Exercício de prática'}</span>
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{ color: 'text.disabled', flexShrink: 0, userSelect: 'none' }}
                        >
                          •
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            color: 'text.secondary',
                            fontSize: '0.75rem',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                        >
                          <CalendarTodayOutlinedIcon sx={{ fontSize: 12, flexShrink: 0 }} />
                          <span>{prazoTexto}</span>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Bloco 2: Progresso com Texto e Barra */}
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: { md: 240 },
                      maxWidth: { md: 460 },
                      width: { xs: '100%', md: 'auto' },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        mb: 0.8,
                        lineHeight: 1.2,
                      }}
                    >
                      {atividade.totalAlunos > 0
                        ? `${atividade.enviados} de ${atividade.totalAlunos} alunos enviaram ao menos uma função`
                        : 'Não há alunos matriculados'}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={atividade.percentual}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: (t) =>
                          t.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.08)'
                            : '#E2E8F0',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: '#2563EB',
                          borderRadius: 3,
                        },
                      }}
                    />
                  </Box>

                  {/* Bloco 3: Percentual em Destaque (SEM seta de clicar) */}
                  <Box
                    sx={{
                      minWidth: { md: 110 },
                      textAlign: { xs: 'left', md: 'right' },
                      flexShrink: 0,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: '#2563EB',
                        fontSize: '0.875rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {atividade.percentual.toFixed(1).replace('.', ',')}% enviaram
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Card>
    </Box>
  );
}

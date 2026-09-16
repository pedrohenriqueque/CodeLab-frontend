/**
 * StudentHistoryPage — Histórico de Atividades e Submissões por Atividade.
 *
 * Apresenta as atividades agrupadas com acordeão expansível, mostrando:
 * - Quantidade de envios (submissões)
 * - Funções realizadas / total de funções
 * - Pontos obtidos / pontuação máxima da atividade
 * - Ao expandir: tabela com as tentativas/submissões daquela atividade, com função,
 *   tentativa, status, nota, data e link direto para ver o resultado detalhado.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Skeleton,
  Alert,
  IconButton,
  Collapse,
} from '@mui/material';

// Icons
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';

import { getSubmissoes } from '../../submissoes/api';
import { getAtividades, getProgressoAluno } from '../api';
import { useAuth } from '../../auth/hooks/useAuthProvider';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', color: '#64748B', bg: '#F1F5F9', border: '#CBD5E1' },
  compilando: { label: 'Compilando', color: '#0284C7', bg: '#E0F2FE', border: '#BAE6FD' },
  executando: { label: 'Executando', color: '#0284C7', bg: '#E0F2FE', border: '#BAE6FD' },
  avaliado: { label: 'Avaliado', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  erro: { label: 'Erro', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
};

function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function StudentHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showError } = useSnackbar();

  const [atividades, setAtividades] = useState([]);
  const [submissoes, setSubmissoes] = useState([]);
  const [progresso, setProgresso] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openActivity, setOpenActivity] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [atividadesData, submissoesData, progressoData] = await Promise.all([
          getAtividades(),
          getSubmissoes(),
          user?.uuid ? getProgressoAluno(user.uuid) : Promise.resolve({ progresso: [] }),
        ]);

        setAtividades(Array.isArray(atividadesData) ? atividadesData : []);
        setSubmissoes(Array.isArray(submissoesData) ? submissoesData : []);
        setProgresso(Array.isArray(progressoData?.progresso) ? progressoData.progresso : []);
      } catch (err) {
        showError(err.response?.data?.detail || 'Erro ao carregar histórico de atividades');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user?.uuid, showError]);

  // Agrupa submissões por atividade e calcula métricas consolidadas
  const historyItems = useMemo(() => {
    return atividades
      .filter((activity) => activity.status !== 'rascunho')
      .map((activity) => {
        const subs = submissoes
          .filter((s) => s.atividadeUuid === activity.uuid)
          .sort((a, b) => new Date(b.dataSubmissao).getTime() - new Date(a.dataSubmissao).getTime());

        // Se o aluno não tiver submissões nesta atividade, não exibe no histórico realizado
        if (subs.length === 0) return null;

        const funcoes = activity.funcoes || [];
        const maxPoints = funcoes.reduce((acc, fn) => acc + (fn.peso ?? fn.pontos ?? 10), 0);

        let earned = 0;
        let functionsDone = 0;

        funcoes.forEach((fn) => {
          const fnUuid = fn.funcaoUuid || fn.uuid;
          const prog = progresso.find((p) => p.funcaoUuid === fnUuid);
          const peso = fn.peso ?? fn.pontos ?? 10;
          if (prog && prog.tentativasUsadas > 0) {
            earned += prog.melhorNota;
            if (prog.melhorNota >= peso) {
              functionsDone += 1;
            }
          }
        });

        return {
          activity,
          subs,
          earned,
          max: maxPoints,
          functionsDone,
          totalFunctions: funcoes.length,
        };
      })
      .filter(Boolean);
  }, [atividades, submissoes, progresso]);

  // Filtro de pesquisa por título da atividade ou função
  const filteredHistory = useMemo(() => {
    if (!search.trim()) return historyItems;
    const q = search.toLowerCase();
    return historyItems.filter((item) => {
      const matchTitle = (item.activity.titulo || '').toLowerCase().includes(q);
      const matchDesc = (item.activity.descricao || '').toLowerCase().includes(q);
      const matchSubs = item.subs.some(
        (s) =>
          (s.funcaoNome || '').toLowerCase().includes(q) ||
          (s.status || '').toLowerCase().includes(q)
      );
      return matchTitle || matchDesc || matchSubs;
    });
  }, [historyItems, search]);

  return (
    <Box className="fade-in" sx={{ pb: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 3.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <HistoryOutlinedIcon sx={{ fontSize: 30, color: '#4F46E5' }} />
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Histórico
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Consulte suas atividades e as tentativas de cada função.
        </Typography>
      </Box>

      {/* Barra de Busca e Contador */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <TextField
          placeholder="Pesquisar atividade ou função no histórico..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: { xs: '100%', sm: 340 }, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {filteredHistory.length} atividade{filteredHistory.length === 1 ? '' : 's'} com tentativas
        </Typography>
      </Box>

      {/* Conteúdo / Cards com Acordeão */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
      ) : filteredHistory.length === 0 ? (
        <Card variant="outlined" sx={{ borderRadius: 3, py: 8, textAlign: 'center', backgroundColor: '#FFFFFF' }}>
          <AssignmentOutlinedIcon sx={{ fontSize: 52, color: '#94A3B8', mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', mb: 0.5 }}>
            {search ? 'Nenhuma atividade encontrada no histórico' : 'Nenhuma atividade realizada ainda'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {search ? 'Tente pesquisar por outro termo.' : 'Acesse as atividades disponíveis para submeter suas resoluções.'}
          </Typography>
          {!search && (
            <Button
              variant="contained"
              component={Link}
              to="/aluno/atividades"
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                backgroundColor: '#4F46E5',
                fontWeight: 600,
                '&:hover': { backgroundColor: '#4338CA' },
              }}
            >
              Ver atividades abertas
            </Button>
          )}
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredHistory.map((item) => {
            const isOpen = openActivity === item.activity.uuid;

            return (
              <Card
                key={item.activity.uuid}
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  borderColor: isOpen ? '#C7D2FE' : '#E2E8F0',
                  boxShadow: isOpen ? '0 4px 12px rgba(79, 70, 229, 0.06)' : '0 1px 3px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s ease',
                  backgroundColor: '#FFFFFF',
                }}
              >
                {/* Cabeçalho da Atividade (Botão Expansível) */}
                <Box
                  component="button"
                  type="button"
                  onClick={() => setOpenActivity(isOpen ? null : item.activity.uuid)}
                  sx={{
                    width: '100%',
                    px: { xs: 2.5, sm: 3 },
                    py: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease',
                    '&:hover': {
                      backgroundColor: '#F8FAFC',
                    },
                  }}
                >
                  <Box sx={{ minWidth: 0, pr: 2 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: '#0F172A',
                        fontSize: '0.98rem',
                        lineHeight: 1.3,
                        mb: 0.5,
                      }}
                    >
                      {item.activity.titulo}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: { xs: 1.5, sm: 3 }, fontSize: '0.78rem', color: '#64748B' }}>
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <strong>{item.subs.length}</strong> envio{item.subs.length !== 1 ? 's' : ''}
                      </Box>
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <strong>{item.functionsDone}/{item.totalFunctions}</strong> funções concluídas
                      </Box>
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        Pontos:{' '}
                        <Typography
                          component="span"
                          sx={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: item.earned >= item.max && item.max > 0 ? '#059669' : '#0F172A',
                            fontSize: '0.85rem',
                          }}
                        >
                          {item.earned.toFixed(1)} / {item.max.toFixed(1)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                    <ExpandMoreIcon
                      sx={{
                        color: '#64748B',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </Box>
                </Box>

                {/* Área Expansível com as Submissões */}
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  <Box sx={{ borderTop: '1px solid #E2E8F0' }}>
                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
                      <Table size="small" sx={{ minWidth: 600 }}>
                        <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                          <TableRow sx={{ borderBottom: '1.5px solid #E2E8F0' }}>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', py: 1.5, pl: 3 }}>
                              Função
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', py: 1.5 }}>
                              Tentativa
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', py: 1.5 }}>
                              Status
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', py: 1.5 }}>
                              Nota
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', py: 1.5 }}>
                              Data
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', py: 1.5, pr: 3 }}>
                              Ação
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {item.subs.map((sub) => {
                            const st = STATUS_CONFIG[sub.status] || STATUS_CONFIG.pendente;
                            const funcName = sub.funcaoNome || 'funcao';
                            const pontosTotal = sub.pontosTotal ?? 10;
                            const notaStr = sub.nota !== null && sub.nota !== undefined ? `${sub.nota.toFixed(1)}/${pontosTotal.toFixed(1)}` : '—';
                            const isNotaMax = sub.nota !== null && sub.nota >= pontosTotal;

                            return (
                              <TableRow
                                key={sub.uuid}
                                hover
                                sx={{
                                  '&:last-child td, &:last-child th': { border: 0 },
                                  transition: 'background-color 0.15s ease',
                                }}
                              >
                                <TableCell sx={{ py: 1.8, pl: 3 }}>
                                  <Link
                                    to={`/aluno/atividades/${item.activity.uuid}/funcao/${sub.funcaoUuid}/submeter`}
                                    style={{ textDecoration: 'none' }}
                                  >
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontFamily: 'monospace',
                                        fontWeight: 700,
                                        color: '#4F46E5',
                                        fontSize: '0.82rem',
                                        '&:hover': { textDecoration: 'underline' },
                                      }}
                                    >
                                      {funcName}()
                                    </Typography>
                                  </Link>
                                </TableCell>
                                <TableCell sx={{ py: 1.8, fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748B' }}>
                                  #{sub.tentativaNumero}
                                </TableCell>
                                <TableCell sx={{ py: 1.8 }}>
                                  <Chip
                                    label={st.label}
                                    size="small"
                                    sx={{
                                      fontWeight: 700,
                                      fontSize: '0.7rem',
                                      height: 22,
                                      backgroundColor: st.bg,
                                      color: st.color,
                                      border: `1px solid ${st.border}`,
                                    }}
                                  />
                                </TableCell>
                                <TableCell sx={{ py: 1.8 }}>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontFamily: 'monospace',
                                      fontWeight: 700,
                                      fontSize: '0.82rem',
                                      color: isNotaMax ? '#059669' : sub.nota > 0 ? '#1E293B' : '#64748B',
                                    }}
                                  >
                                    {notaStr}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ py: 1.8, fontSize: '0.78rem', color: '#64748B' }}>
                                  {formatDate(sub.dataSubmissao)}
                                </TableCell>
                                <TableCell align="right" sx={{ py: 1.8, pr: 3 }}>
                                  <Button
                                    component={Link}
                                    to={`/aluno/submissoes/${sub.uuid}`}
                                    size="small"
                                    endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                                    sx={{
                                      textTransform: 'none',
                                      fontWeight: 600,
                                      fontSize: '0.78rem',
                                      color: '#4F46E5',
                                      borderRadius: 1.5,
                                      px: 1.25,
                                      py: 0.5,
                                      '&:hover': { backgroundColor: '#EEF2FF' },
                                    }}
                                  >
                                    Ver resultado
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Collapse>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

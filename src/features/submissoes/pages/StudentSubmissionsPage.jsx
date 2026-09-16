/**
 * StudentSubmissionsPage — Página de listagem das submissões do aluno.
 *
 * Permite ao aluno acompanhar todas as suas tentativas por função e atividade,
 * status da avaliação, nota obtida e acessar a visualização detalhada do resultado.
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
  Tooltip,
  IconButton,
} from '@mui/material';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { getSubmissoes } from '../api';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', color: '#64748B', bg: '#F1F5F9', border: '#CBD5E1' },
  compilando: { label: 'Compilando', color: '#0284C7', bg: '#E0F2FE', border: '#BAE6FD' },
  executando: { label: 'Executando', color: '#0284C7', bg: '#E0F2FE', border: '#BAE6FD' },
  avaliado: { label: 'Avaliado', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  erro: { label: 'Erro', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
};

function formatDateTime(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function StudentSubmissionsPage() {
  const navigate = useNavigate();
  const { showError } = useSnackbar();

  const [submissoes, setSubmissoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getSubmissoes();
        setSubmissoes(Array.isArray(data) ? data : []);
      } catch (err) {
        showError(err.response?.data?.detail || 'Erro ao carregar histórico de submissões');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [showError]);

  const filteredSubmissions = useMemo(() => {
    if (!search.trim()) return submissoes;
    const q = search.toLowerCase();
    return submissoes.filter(
      (s) =>
        (s.funcaoNome || '').toLowerCase().includes(q) ||
        (s.atividadeTitulo || '').toLowerCase().includes(q) ||
        (s.status || '').toLowerCase().includes(q)
    );
  }, [submissoes, search]);

  return (
    <Box className="fade-in" sx={{ pb: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 3.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <FactCheckOutlinedIcon sx={{ fontSize: 30, color: '#4F46E5' }} />
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Minhas submissões
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Cada função é enviada e avaliada separadamente. Acompanhe o status e notas das suas tentativas.
        </Typography>
      </Box>

      {/* Barra de Busca e Filtros */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <TextField
          placeholder="Pesquisar por função ou atividade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: { xs: '100%', sm: 320 }, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {filteredSubmissions.length} submiss{filteredSubmissions.length === 1 ? 'ão' : 'ões'} encontrada{filteredSubmissions.length === 1 ? '' : 's'}
        </Typography>
      </Box>

      {/* Conteúdo / Tabela */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rounded" height={60} sx={{ borderRadius: 2.5 }} />
          ))}
        </Box>
      ) : filteredSubmissions.length === 0 ? (
        <Card variant="outlined" sx={{ borderRadius: 3, py: 8, textAlign: 'center', backgroundColor: '#FFFFFF' }}>
          <FactCheckOutlinedIcon sx={{ fontSize: 52, color: '#94A3B8', mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', mb: 0.5 }}>
            {search ? 'Nenhuma submissão encontrada' : 'Você ainda não enviou nenhuma solução'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {search ? 'Tente pesquisar por outro termo.' : 'Acesse as atividades disponíveis para submeter seu código.'}
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
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            border: '1px solid #E2E8F0',
          }}
        >
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
              <TableRow sx={{ borderBottom: '1.5px solid #E2E8F0' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B' }}>
                  Função
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B' }}>
                  Atividade
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B' }}>
                  Tentativa
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B' }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B' }}>
                  Nota
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B' }}>
                  Data
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B' }}>
                  Ação
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSubmissions.map((sub) => {
                const st = STATUS_CONFIG[sub.status] || STATUS_CONFIG.pendente;
                const funcName = sub.funcaoNome || 'funcao';
                const ativTitle = sub.atividadeTitulo || 'Atividade';
                const pontosTotal = sub.pontosTotal ?? 10;
                const notaStr = sub.nota !== null && sub.nota !== undefined ? `${sub.nota.toFixed(1)}/${pontosTotal.toFixed(1)}` : '—';
                const isNotaMax = sub.nota !== null && sub.nota >= pontosTotal;

                return (
                  <TableRow
                    key={sub.uuid}
                    hover
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      transition: 'background-color 0.15s',
                    }}
                  >
                    <TableCell sx={{ py: 2 }}>
                      <Link
                        to={`/aluno/atividades/${sub.atividadeUuid}/funcao/${sub.funcaoUuid}/submeter`}
                        style={{ textDecoration: 'none' }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: '#4F46E5',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          {funcName}()
                        </Typography>
                      </Link>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Link
                        to={`/aluno/atividades/${sub.atividadeUuid}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#334155',
                            fontWeight: 500,
                            fontSize: '0.85rem',
                            '&:hover': { color: '#4F46E5' },
                          }}
                        >
                          {ativTitle}
                        </Typography>
                      </Link>
                    </TableCell>
                    <TableCell sx={{ py: 2, fontFamily: 'monospace', fontSize: '0.85rem', color: '#64748B' }}>
                      #{sub.tentativaNumero}
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Chip
                        label={st.label}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          height: 22,
                          backgroundColor: st.bg,
                          color: st.color,
                          border: `1px solid ${st.border}`,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: isNotaMax ? '#059669' : sub.nota > 0 ? '#1E293B' : '#64748B',
                        }}
                      >
                        {notaStr}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2, fontSize: '0.8rem', color: '#64748B' }}>
                      {formatDateTime(sub.dataSubmissao)}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 2 }}>
                      <Button
                        component={Link}
                        to={`/aluno/submissoes/${sub.uuid}`}
                        size="small"
                        startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 16 }} />}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          color: '#4F46E5',
                          borderRadius: 2,
                          px: 1.5,
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
      )}
    </Box>
  );
}

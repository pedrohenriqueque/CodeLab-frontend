/**
 * FunctionLibraryPage â€” Biblioteca de Funções Reutilizáveis (Professor).
 *
 * Funcionalidades:
 * - Listagem de todas as funções da biblioteca global
 * - Pesquisa por nome ou descrição
 * - Filtro por dificuldade padrão (todas, facil, medio, dificil)
 * - Botão "+ Nova Função"
 * - Edição de função (FunctionFormDialog)
 * - Gestão de casos de teste canônicos (FunctionTestCasesDialog)
 * - Exclusão com bloqueio amigável caso vinculada a atividades (409)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Pagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import FunctionsIcon from '@mui/icons-material/Functions';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import ClearIcon from '@mui/icons-material/Clear';

import {
  getBibliotecaFuncoes,
  createFuncao,
  updateFuncao,
  deleteFuncao,
  duplicarFuncao,
} from '../api';
import FunctionFormDialog from '../components/FunctionFormDialog';
import FunctionTestCasesDialog from '../components/FunctionTestCasesDialog';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';
import { useAuth } from '../../auth/hooks/useAuthProvider';

const DIFICULDADE_MAP = {
  facil: { label: 'Fácil', color: 'success' },
  medio: { label: 'Médio', color: 'warning' },
  dificil: { label: 'Difícil', color: 'error' },
};

const ITEMS_PER_PAGE = 9;

export default function FunctionLibraryPage() {
  const [funcoes, setFuncoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [dificuldadeFilter, setDificuldadeFilter] = useState('todas');
  const [autoriaFilter, setAutoriaFilter] = useState('todas');
  const [page, setPage] = useState(1);

  // Modais
  const [formOpen, setFormOpen] = useState(false);
  const [editingFuncao, setEditingFuncao] = useState(null);
  const [testCasesFuncao, setTestCasesFuncao] = useState(null);
  const [deleteConfirmFuncao, setDeleteConfirmFuncao] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState(null);

  const { user } = useAuth();
  const { showSuccess, showError } = useSnackbar();

  const fetchFuncoes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBibliotecaFuncoes();
      setFuncoes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao carregar funções da biblioteca');
      setFuncoes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFuncoes();
  }, [fetchFuncoes]);

  const normalize = (str) =>
    (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const filteredFuncoes = useMemo(() => {
    return funcoes.filter((fn) => {
      // 1. Busca por nome, descrição, tipo de retorno, parâmetros ou autor
      if (searchQuery.trim()) {
        const queryNorm = normalize(searchQuery.trim());
        const nomeNorm = normalize(fn.nome);
        const enunciadoNorm = normalize(fn.enunciado);
        const retornoNorm = normalize(fn.tipoRetorno || fn.tipo_retorno);
        const autorNorm = normalize(fn.professorNome || fn.professor_nome);
        const paramsNorm = normalize((fn.parametros || []).map((p) => `${p.tipo} ${p.nome}`).join(' '));

        const match =
          nomeNorm.includes(queryNorm) ||
          enunciadoNorm.includes(queryNorm) ||
          retornoNorm.includes(queryNorm) ||
          autorNorm.includes(queryNorm) ||
          paramsNorm.includes(queryNorm);

        if (!match) return false;
      }

      // 2. Filtro por Dificuldade
      if (dificuldadeFilter !== 'todas') {
        const diff = String(fn.dificuldade || fn.dificuldadePadrao || '').toLowerCase();
        if (diff !== dificuldadeFilter.toLowerCase()) return false;
      }

      // 3. Filtro por Autoria
      if (autoriaFilter === 'minhas') {
        const isMinha = Boolean(
          user?.uuid && (user.uuid === fn.professorUuid || user.uuid === fn.professor_uuid)
        );
        if (!isMinha) return false;
      }

      return true;
    });
  }, [funcoes, searchQuery, dificuldadeFilter, autoriaFilter, user?.uuid]);

  // Reseta para a primeira página quando os filtros mudam
  useEffect(() => {
    setPage(1);
  }, [searchQuery, dificuldadeFilter, autoriaFilter]);

  const pageCount = Math.ceil(filteredFuncoes.length / ITEMS_PER_PAGE) || 1;

  const paginatedFuncoes = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredFuncoes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredFuncoes, page]);

  const hasActiveFilters =
    searchQuery.trim() !== '' || dificuldadeFilter !== 'todas' || autoriaFilter !== 'todas';

  const handleClearFilters = () => {
    setSearchQuery('');
    setDificuldadeFilter('todas');
    setAutoriaFilter('todas');
    setPage(1);
  };

  const handleCreateOrUpdate = async (formData) => {
    try {
      if (editingFuncao?.uuid) {
        await updateFuncao(editingFuncao.uuid, formData);
        showSuccess('Função atualizada com sucesso na biblioteca!');
      } else {
        await createFuncao(formData);
        showSuccess('Função criada com sucesso na biblioteca!');
      }
      setFormOpen(false);
      setEditingFuncao(null);
      await fetchFuncoes();
    } catch (err) {
      showError(err.response?.data?.erro || 'Erro ao salvar função na biblioteca');
      throw err;
    }
  };

  const handleDuplicar = async (fn) => {
    setDuplicatingId(fn.uuid);
    try {
      await duplicarFuncao(fn.uuid);
      showSuccess(`Função "${fn.nome}" duplicada com sucesso! Cópia criada com sua autoria.`);
      await fetchFuncoes();
    } catch (err) {
      showError(err.response?.data?.detail || 'Erro ao duplicar função');
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmFuncao?.uuid) return;
    setDeleting(true);
    try {
      await deleteFuncao(deleteConfirmFuncao.uuid);
      showSuccess('Função removida da biblioteca!');
      setDeleteConfirmFuncao(null);
      await fetchFuncoes();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Erro ao excluir função da biblioteca';
      showError(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box className="fade-in">
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em' }}>
            Biblioteca de Funções
          </Typography>
          <Typography variant="subtitle1" sx={{ mt: 0.5, color: '#64748B' }}>
            Funções C e casos de teste reutilizáveis em atividades
          </Typography>
        </Box>
        <Button
          id="btn-nova-funcao"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingFuncao(null);
            setFormOpen(true);
          }}
          sx={{
            borderRadius: '9999px',
            px: 3,
            py: 1,
            fontWeight: 700,
            fontSize: '0.9rem',
            bgcolor: '#1D4ED8',
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': {
              bgcolor: '#1E40AF',
            },
          }}
        >
          Nova Função
        </Button>
      </Box>

      {/* Card de Filtros e Busca */}
      <Box
        sx={{
          bgcolor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          p: { xs: 2, sm: 2.25 },
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 2.5,
            flexWrap: 'wrap',
          }}
        >
          {/* Campo de Busca em Formato Pílula */}
          <TextField
            id="busca-funcoes"
            placeholder="Pesquisar função por nome ou descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{
              flex: { xs: '1 1 100%', md: '1 1 320px' },
              maxWidth: { md: 440 },
              '& .MuiOutlinedInput-root': {
                borderRadius: '9999px',
                backgroundColor: '#FFFFFF',
                fontSize: '0.875rem',
                color: '#0F172A',
                '& fieldset': {
                  borderColor: '#E2E8F0',
                },
                '&:hover fieldset': {
                  borderColor: '#CBD5E1',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#2563EB',
                  borderWidth: '1.5px',
                },
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#94A3B8',
                opacity: 1,
                fontSize: '0.85rem',
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')} sx={{ p: 0.5 }}>
                      <ClearIcon sx={{ fontSize: 16, color: '#94A3B8' }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')} sx={{ p: 0.5 }}>
                    <ClearIcon sx={{ fontSize: 16, color: '#94A3B8' }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />

          {/* Filtro Dificuldade */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <BarChartRoundedIcon sx={{ fontSize: 17, color: '#475569' }} />
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                Dificuldade
              </Typography>
              <Tooltip title="Filtrar por nível de dificuldade das funções" arrow placement="top">
                <HelpOutlineOutlinedIcon sx={{ fontSize: 14, color: '#94A3B8', cursor: 'pointer' }} />
              </Tooltip>
            </Box>
            <ToggleButtonGroup
              value={dificuldadeFilter}
              exclusive
              onChange={(_, val) => val && setDificuldadeFilter(val)}
              size="small"
              sx={{
                bgcolor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '9999px',
                p: '3px',
                gap: '3px',
                '& .MuiToggleButtonGroup-grouped': {
                  border: 'none',
                  borderRadius: '9999px !important',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  px: 1.75,
                  py: 0.45,
                  color: '#475569',
                  '&.Mui-selected': {
                    bgcolor: '#3B82F6',
                    color: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(37, 99, 235, 0.25)',
                    '&:hover': {
                      bgcolor: '#2563EB',
                    },
                  },
                  '&:hover': {
                    bgcolor: '#F1F5F9',
                  },
                },
              }}
            >
              <ToggleButton value="todas">Todas</ToggleButton>
              <ToggleButton value="facil">Fácil</ToggleButton>
              <ToggleButton value="medio">Médio</ToggleButton>
              <ToggleButton value="dificil">Difícil</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Filtro Autoria */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PersonOutlineOutlinedIcon sx={{ fontSize: 17, color: '#475569' }} />
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                Autoria
              </Typography>
            </Box>
            <ToggleButtonGroup
              value={autoriaFilter}
              exclusive
              onChange={(_, val) => val && setAutoriaFilter(val)}
              size="small"
              sx={{
                bgcolor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '9999px',
                p: '3px',
                gap: '3px',
                '& .MuiToggleButtonGroup-grouped': {
                  border: 'none',
                  borderRadius: '9999px !important',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  px: 2,
                  py: 0.45,
                  color: '#475569',
                  '&.Mui-selected': {
                    bgcolor: '#3B82F6',
                    color: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(37, 99, 235, 0.25)',
                    '&:hover': {
                      bgcolor: '#2563EB',
                    },
                  },
                  '&:hover': {
                    bgcolor: '#F1F5F9',
                  },
                },
              }}
            >
              <ToggleButton value="todas">Todas</ToggleButton>
              <ToggleButton value="minhas">Minhas funções</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Contador de Funções Encontradas */}
          <Box sx={{ ml: { xs: 0, lg: 'auto' }, pb: 0.75 }}>
            <Typography sx={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 500 }}>
              {filteredFuncoes.length}{' '}
              {filteredFuncoes.length === 1 ? 'função encontrada' : 'funções encontradas'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Feedback de erro */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Grid de Funções */}
      {loading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 2.5 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={160} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
      ) : filteredFuncoes.length === 0 ? (
        <Card variant="outlined" sx={{ borderRadius: 3, py: 8, textAlign: 'center', backgroundColor: '#FAFCFF' }}>
          <FunctionsIcon sx={{ fontSize: 56, color: '#94A3B8', mb: 1.5 }} />
          <Typography variant="h6" sx={{ color: '#334155', fontWeight: 600 }}>
            Nenhuma função encontrada
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
            {hasActiveFilters
              ? 'Tente alterar os termos da busca ou limpar os filtros.'
              : 'Comece criando a primeira função reutilizável da biblioteca.'}
          </Typography>
          {hasActiveFilters ? (
            <Button
              variant="outlined"
              onClick={handleClearFilters}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Limpar Filtros
            </Button>
          ) : (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingFuncao(null);
                setFormOpen(true);
              }}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Criar Função
            </Button>
          )}
        </Card>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 2.5 }}>
          {paginatedFuncoes.map((fn) => {
            const dif = DIFICULDADE_MAP[String(fn.dificuldade || 'MEDIO').toLowerCase()] || DIFICULDADE_MAP.medio;
            const paramList = (fn.parametros || []).map((p) => `${p.tipo} ${p.nome}`).join(', ');
            const assinatura = `${fn.tipoRetorno} ${fn.nome}(${paramList})`;
            const isAutor = Boolean(user?.uuid && user.uuid === fn.professorUuid);
            const totalCasosTeste = Number(fn.totalCasosTeste || 0);

            return (
              <Card
                key={fn.uuid}
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  borderColor: '#E2E8F0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
                    borderColor: '#CBD5E1',
                  },
                }}
              >
                <CardContent sx={{ p: 2.5, flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
                    <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.05rem', color: '#0F172A', overflowWrap: 'anywhere' }}>
                      {assinatura}
                    </Typography>

                    <Chip
                      label={dif.label}
                      color={dif.color}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                    />
                  </Box>

                  <Tooltip title={fn.enunciado || ''} disableHoverListener={!fn.enunciado}>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, mb: 1.25, minHeight: 40, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {fn.enunciado}
                    </Typography>
                  </Tooltip>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, pt: 1, minHeight: 22, borderTop: '1px solid #F1F5F9' }}>
                    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>Criado por: {fn.professorNome}</Typography>
                    {isAutor && <Chip label="Sua autoria" size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />}
                  </Box>


                  {/* Ações */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, pt: 1.5, borderTop: '1px solid #F1F5F9', flexWrap: 'wrap' }}>
                    <Tooltip title={!isAutor && totalCasosTeste === 0 ? 'Esta função compartilhada ainda não tem casos. Duplique-a para adicionar os seus.' : ''}>
                      <span>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<FactCheckOutlinedIcon />}
                          disabled={!isAutor && totalCasosTeste === 0}
                          onClick={() => setTestCasesFuncao(fn)}
                          sx={{
                            textTransform: 'none', fontWeight: 600, borderRadius: 2,
                            color: '#FFFFFF', backgroundColor: '#4F46E5', boxShadow: 'none',
                            '&:hover': { backgroundColor: '#4338CA', boxShadow: 'none' },
                            '&.Mui-disabled': { color: '#64748B', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1' },
                          }}
                        >
                          {totalCasosTeste > 0 || !isAutor ? `Casos de teste (${totalCasosTeste})` : 'Adicionar casos de teste'}
                        </Button>
                      </span>
                    </Tooltip>

                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      <Tooltip title="Duplicar Função (criar uma cópia para você)">
                        <span>
                          <IconButton
                            size="small"
                            aria-label="Duplicar função"
                            disabled={duplicatingId === fn.uuid}
                            onClick={() => handleDuplicar(fn)}
                            sx={{ border: '1px solid #E2E8F0', borderRadius: 2, color: '#4F46E5' }}
                          >
                            {duplicatingId === fn.uuid ? (
                              <CircularProgress size={16} color="inherit" />
                            ) : (
                              <ContentCopyOutlinedIcon fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Tooltip title={isAutor ? "Editar Função" : "Apenas o autor pode editar esta função. Duplique-a para criar sua cópia."}>
                        <span>
                          <IconButton
                            size="small"
                            aria-label="Editar função"
                            disabled={!isAutor}
                            onClick={() => {
                              setEditingFuncao(fn);
                              setFormOpen(true);
                            }}
                            sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Tooltip title={isAutor ? "Excluir Função" : "Apenas o autor pode excluir esta função."}>
                        <span>
                          <IconButton
                            size="small"
                            aria-label="Excluir função"
                            color="error"
                            disabled={!isAutor}
                            onClick={() => setDeleteConfirmFuncao(fn)}
                            sx={{ border: '1px solid #FEE2E2', borderRadius: 2 }}
                          >
                            <DeleteOutlineOutlinedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Paginação a cada 9 itens */}
      {!loading && pageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 3 }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, value) => {
              setPage(value);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            color="primary"
            shape="rounded"
            size="medium"
            sx={{
              '& .MuiPaginationItem-root': {
                fontWeight: 600,
                borderRadius: '8px',
              },
              '& .Mui-selected': {
                bgcolor: '#2563EB !important',
                color: '#FFFFFF !important',
              },
            }}
          />
        </Box>
      )}

      {/* Modal Criar / Editar Função */}
      <FunctionFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingFuncao(null);
        }}
        onSave={handleCreateOrUpdate}
        initialData={editingFuncao}
      />

      {/* Modal Casos de Teste Canônicos */}
      {testCasesFuncao && (
        <FunctionTestCasesDialog
          open={!!testCasesFuncao}
          onClose={() => setTestCasesFuncao(null)}
          funcao={testCasesFuncao}
          onUpdated={fetchFuncoes}
        />
      )}

      {/* Dialog Confirmação Exclusão */}
      <Dialog
        open={!!deleteConfirmFuncao}
        onClose={() => setDeleteConfirmFuncao(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#DC2626' }}>
          Excluir Função da Biblioteca?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Deseja realmente excluir a função <strong>{deleteConfirmFuncao?.nome}</strong> e seus casos de teste canônicos?
          </Typography>
          <Alert severity="warning" variant="outlined" sx={{ mt: 1.5, borderRadius: 2 }}>
            Se a função estiver vinculada a alguma atividade existente, a exclusão será bloqueada para manter a integridade das atividades.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteConfirmFuncao(null)} disabled={deleting} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            {deleting ? 'Excluindo...' : 'Excluir Função'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

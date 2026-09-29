import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  alpha,
  useTheme,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

import useAtividades from '../hooks/useAtividades';
import { deleteAtividade, encerrarAtividade, updateAtividade } from '../api';
import { getSubmissoes } from '../../submissoes/api';
import StatsCards from '../components/StatsCards';
import ActivityTable from '../components/ActivityTable';
import { useTurmaContext } from '../../turmas/context/TurmaContext';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';

export default function ActivityListPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const { showSuccess, showError } = useSnackbar();

  const { turmaAtiva, turmas, setTurmaAtiva } = useTurmaContext();
  const { atividades, loading, error, refetch } = useAtividades();

  // Submissões para regras de exclusão ("quando der")
  const [submissionCounts, setSubmissionCounts] = useState({});

  const reloadSubmissions = useCallback(async () => {
    try {
      const subs = await getSubmissoes();
      const counts = {};
      (subs || []).forEach((s) => {
        const aId = s.atividadeUuid || s.atividade_uuid;
        if (aId) {
          counts[aId] = (counts[aId] || 0) + 1;
        }
      });
      setSubmissionCounts(counts);
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    getSubmissoes()
      .then((subs) => {
        if (!ativo) return;
        const counts = {};
        (subs || []).forEach((s) => {
          const aId = s.atividadeUuid || s.atividade_uuid;
          if (aId) {
            counts[aId] = (counts[aId] || 0) + 1;
          }
        });
        setSubmissionCounts(counts);
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  const refetchAll = useCallback(async () => {
    await Promise.all([refetch(), reloadSubmissions()]);
  }, [refetch, reloadSubmissions]);

  // Estados de filtro e busca
  const [statusFilter, setStatusFilter] = useState('TODAS');
  const [searchQuery, setSearchQuery] = useState('');

  // Ordenação
  const [sortField, setSortField] = useState('titulo');
  const [sortDirection, setSortDirection] = useState('asc');

  // Estado para modal de exclusão
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Estado para modal de encerramento
  const [activityToClose, setActivityToClose] = useState(null);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState(null);

  // Estado para modal de edição de prazo
  const [editDeadlineToActivity, setEditDeadlineToActivity] = useState(null);
  const [newDeadlineDate, setNewDeadlineDate] = useState('');
  const [newDeadlineTime, setNewDeadlineTime] = useState('23:59');
  const [savingDeadline, setSavingDeadline] = useState(false);
  const [deadlineError, setDeadlineError] = useState(null);

  // Contagens para os pills
  const total = atividades.length;
  const rascunhos = useMemo(() => atividades.filter((a) => a.status === 'RASCUNHO').length, [atividades]);
  const publicadas = useMemo(() => atividades.filter((a) => a.status === 'PUBLICADA').length, [atividades]);
  const encerradas = useMemo(() => atividades.filter((a) => a.status === 'ENCERRADA').length, [atividades]);

  const filterTabs = [
    { key: 'TODAS', label: `Todas (${total})` },
    { key: 'RASCUNHO', label: `Rascunhos (${rascunhos})` },
    { key: 'PUBLICADA', label: `Publicadas (${publicadas})` },
    { key: 'ENCERRADA', label: `Encerradas (${encerradas})` },
  ];

  // Alterna ordenação
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Regras de negócio para exclusão: apenas rascunhos ou publicadas sem submissões
  const canDeleteActivity = (atv) => {
    if (!atv) return false;
    if (atv.status === 'RASCUNHO') return true;
    const isEnc = atv.status === 'ENCERRADA';
    const hasSubs = (atv.totalSubmissoes || 0) > 0;
    return !isEnc && !hasSubs;
  };

  // Filtragem e ordenação das atividades com contagem real de submissões
  const filteredAndSortedAtividades = useMemo(() => {
    let result = atividades.map((a) => ({
      ...a,
      totalSubmissoes:
        submissionCounts[a.uuid] ??
        a.totalSubmissoes ??
        a.total_submissoes ??
        a.submissoes_count ??
        0,
    }));

    // Filtro por status
    if (statusFilter !== 'TODAS') {
      result = result.filter((a) => a.status === statusFilter);
    }

    // Filtro por busca
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.titulo?.toLowerCase().includes(q) ||
          a.descricao?.toLowerCase().includes(q)
      );
    }

    // Ordenação
    result.sort((a, b) => {
      let comparison;
      switch (sortField) {
        case 'titulo':
          comparison = (a.titulo || '').localeCompare(b.titulo || '', 'pt-BR');
          break;
        case 'tipo':
          comparison = (a.tipo || '').localeCompare(b.tipo || '');
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        case 'periodo': {
          const dateA = a.fimEm ? new Date(a.fimEm).getTime() : 0;
          const dateB = b.fimEm ? new Date(b.fimEm).getTime() : 0;
          comparison = dateA - dateB;
          break;
        }
        case 'funcoes': {
          const fCountA = a.funcoes?.length ?? 0;
          const fCountB = b.funcoes?.length ?? 0;
          comparison = fCountA - fCountB;
          break;
        }
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [atividades, submissionCounts, statusFilter, searchQuery, sortField, sortDirection]);

  // Abre diálogo de edição de prazo
  const handleOpenEditDeadline = (atv) => {
    if (!atv) return;
    setEditDeadlineToActivity(atv);
    setDeadlineError(null);
    const dateVal = atv.fimEm || atv.dataFechamento;
    if (dateVal) {
      const dateObj = new Date(dateVal);
      if (!isNaN(dateObj.getTime())) {
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const hh = String(dateObj.getHours()).padStart(2, '0');
        const min = String(dateObj.getMinutes()).padStart(2, '0');
        setNewDeadlineDate(`${yyyy}-${mm}-${dd}`);
        setNewDeadlineTime(`${hh}:${min}`);
        return;
      }
    }
    setNewDeadlineDate('');
    setNewDeadlineTime('23:59');
  };

  // Salva novo prazo
  const handleSaveDeadline = async () => {
    if (!editDeadlineToActivity || !newDeadlineDate) {
      setDeadlineError('Informe uma data válida.');
      return;
    }
    setSavingDeadline(true);
    setDeadlineError(null);
    try {
      const isoString = new Date(`${newDeadlineDate}T${newDeadlineTime || '23:59'}:00`).toISOString();
      await updateAtividade(editDeadlineToActivity.uuid, { fimEm: isoString });
      showSuccess('Prazo de encerramento atualizado com sucesso.');
      setEditDeadlineToActivity(null);
      await refetchAll();
    } catch (err) {
      setDeadlineError(err.response?.data?.detail || err.response?.data?.erro || 'Erro ao atualizar prazo.');
      showError(err.response?.data?.detail || err.response?.data?.erro || 'Erro ao atualizar prazo.');
    } finally {
      setSavingDeadline(false);
    }
  };

  // Confirma encerramento de atividade
  const handleConfirmClose = async () => {
    if (!activityToClose) return;
    setClosing(true);
    setCloseError(null);
    try {
      await encerrarAtividade(activityToClose.uuid);
      showSuccess('Atividade encerrada com sucesso.');
      setActivityToClose(null);
      await refetchAll();
    } catch (err) {
      setCloseError(err.response?.data?.detail || err.response?.data?.erro || 'Não foi possível encerrar a atividade.');
      showError(err.response?.data?.detail || err.response?.data?.erro || 'Não foi possível encerrar a atividade.');
    } finally {
      setClosing(false);
    }
  };

  // Confirma exclusão (apenas quando permitido)
  const handleConfirmDelete = async () => {
    if (!activityToDelete || !canDeleteActivity(activityToDelete)) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAtividade(activityToDelete.uuid);
      showSuccess(
        activityToDelete.status === 'RASCUNHO'
          ? 'Rascunho excluído com sucesso.'
          : 'Atividade excluída com sucesso.'
      );
      setActivityToDelete(null);
      await refetchAll();
    } catch (err) {
      setDeleteError(err.response?.data?.detail || err.response?.data?.erro || 'Erro ao excluir atividade.');
      showError(err.response?.data?.detail || err.response?.data?.erro || 'Erro ao excluir atividade.');
    } finally {
      setDeleting(false);
    }
  };

  // Navega para submissões ajustando a turma se necessário
  const handleViewSubmissions = (activityUuid) => {
    const atv = atividades.find((a) => a.uuid === activityUuid);
    const tUuid = atv?.turmaUuid || atv?.turma_uuid;
    if (tUuid && turmaAtiva?.uuid !== tUuid) {
      const t = turmas.find((item) => item.uuid === tUuid);
      if (t) setTurmaAtiva(t);
    }
    navigate(`/submissoes?atividade=${activityUuid}`);
  };

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Cabeçalho */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: 'text.primary',
              fontSize: { xs: '1.5rem', sm: '1.85rem' },
              letterSpacing: '-0.03em',
            }}
          >
            Minhas atividades
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mt: 0.5,
              fontSize: '0.875rem',
            }}
          >
            Gerencie as atividades da turma {turmaAtiva?.nome || 'selecionada'}.
          </Typography>
        </Box>

        <Button
          id="btn-criar-atividade"
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => navigate('/atividades/criar')}
          sx={{
            bgcolor: '#2563EB',
            color: '#FFFFFF',
            borderRadius: 2.5,
            px: 2.5,
            py: 1,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.875rem',
            boxShadow: 'none',
            whiteSpace: 'nowrap',
            '&:hover': {
              bgcolor: '#1D4ED8',
              boxShadow: 'none',
            },
          }}
        >
          Criar atividade
        </Button>
      </Box>

      {/* Cards de Resumo */}
      {loading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2.5 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={102} sx={{ borderRadius: 3.5 }} />
          ))}
        </Box>
      ) : (
        <StatsCards atividades={atividades} />
      )}

      {/* Barra de Filtros (Pills à Esquerda + Busca à Direita) */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'center' },
          gap: 2,
        }}
      >
        {/* Pills de Status */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            overflowX: 'auto',
            pb: { xs: 0.5, md: 0 },
          }}
        >
          {filterTabs.map((tab) => {
            const isSelected = statusFilter === tab.key;
            return (
              <Box
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                sx={{
                  px: 2,
                  py: 0.75,
                  borderRadius: 2.5,
                  fontSize: '0.8125rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  bgcolor: isSelected
                    ? '#2563EB'
                    : isDark
                      ? alpha(theme.palette.background.paper, 0.6)
                      : 'background.paper',
                  color: isSelected ? '#FFFFFF' : 'text.secondary',
                  border: '1px solid',
                  borderColor: isSelected
                    ? '#2563EB'
                    : isDark
                      ? 'divider'
                      : '#E2E8F0',
                  '&:hover': {
                    bgcolor: isSelected ? '#1D4ED8' : 'action.hover',
                    color: isSelected ? '#FFFFFF' : 'text.primary',
                  },
                }}
              >
                {tab.label}
              </Box>
            );
          })}
        </Box>

        {/* Campo de Busca */}
        <TextField
          id="search-atividades"
          placeholder="Buscar atividade..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{
            minWidth: { xs: '100%', sm: 300 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 2.5,
              height: 40,
              bgcolor: 'background.paper',
              fontSize: '0.8125rem',
              '& fieldset': {
                borderColor: 'divider',
              },
              '&:hover fieldset': {
                borderColor: 'primary.main',
              },
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {/* Erro global */}
      {error && (
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabela de Atividades */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rounded" height={68} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      ) : (
        <ActivityTable
          atividades={filteredAndSortedAtividades}
          onView={(uuid) => navigate(`/atividades/${uuid}`)}
          onEdit={(uuid) => navigate(`/atividades/${uuid}/editar`)}
          onDelete={(atv) => setActivityToDelete(atv)}
          onEditDeadline={handleOpenEditDeadline}
          onCloseActivity={(atv) => setActivityToClose(atv)}
          onViewSubmissions={handleViewSubmissions}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      )}

      {/* Modal de Edição de Prazo */}
      <Dialog
        open={Boolean(editDeadlineToActivity)}
        onClose={() => !savingDeadline && setEditDeadlineToActivity(null)}
        PaperProps={{
          sx: { borderRadius: 3.5, p: 1, maxWidth: 440 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.15rem' }}>
          Editar prazo de encerramento
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.875rem', mb: 2.5 }}>
            Ajuste a data e horário limite para entrega de soluções na atividade{' '}
            <strong>"{editDeadlineToActivity?.titulo}"</strong>.
          </DialogContentText>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Data de encerramento"
              type="date"
              value={newDeadlineDate}
              onChange={(e) => setNewDeadlineDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
            />
            <TextField
              label="Horário de encerramento"
              type="time"
              value={newDeadlineTime}
              onChange={(e) => setNewDeadlineTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
            />
          </Box>
          {deadlineError && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
              {deadlineError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setEditDeadlineToActivity(null)}
            disabled={savingDeadline}
            sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveDeadline}
            variant="contained"
            disabled={savingDeadline}
            sx={{
              bgcolor: '#2563EB',
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#1D4ED8' },
            }}
          >
            {savingDeadline ? 'Salvando...' : 'Salvar prazo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Confirmação de Encerramento */}
      <Dialog
        open={Boolean(activityToClose)}
        onClose={() => !closing && setActivityToClose(null)}
        PaperProps={{
          sx: { borderRadius: 3.5, p: 1, maxWidth: 420 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.15rem' }}>
          Encerrar atividade
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.875rem' }}>
            Tem certeza de que deseja encerrar a atividade{' '}
            <strong>"{activityToClose?.titulo}"</strong> agora? Nenhum aluno poderá enviar novas submissões após o encerramento.
          </DialogContentText>
          {closeError && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
              {closeError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setActivityToClose(null)}
            disabled={closing}
            sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmClose}
            variant="contained"
            color="warning"
            disabled={closing}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              boxShadow: 'none',
            }}
          >
            {closing ? 'Encerrando...' : 'Encerrar agora'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog
        open={Boolean(activityToDelete)}
        onClose={() => !deleting && setActivityToDelete(null)}
        PaperProps={{
          sx: {
            borderRadius: 3.5,
            p: 1,
            maxWidth: 440,
            ...(activityToDelete && !canDeleteActivity(activityToDelete) && {
              bgcolor: isDark ? '#1E293B' : '#F8FAFC',
              border: '1px solid',
              borderColor: isDark ? alpha('#94A3B8', 0.2) : '#E2E8F0',
            }),
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            fontSize: '1.15rem',
            color: activityToDelete && canDeleteActivity(activityToDelete)
              ? '#DC2626'
              : isDark
                ? '#94A3B8'
                : '#64748B',
          }}
        >
          {activityToDelete && canDeleteActivity(activityToDelete)
            ? activityToDelete.status === 'RASCUNHO'
              ? 'Excluir rascunho'
              : 'Excluir atividade permanentemente'
            : 'Exclusão não permitida'}
        </DialogTitle>
        <DialogContent>
          {activityToDelete && canDeleteActivity(activityToDelete) ? (
            <DialogContentText sx={{ fontSize: '0.875rem' }}>
              Tem certeza de que deseja excluir {activityToDelete.status === 'RASCUNHO' ? 'o rascunho da atividade' : 'permanentemente a atividade'}{' '}
              <strong>"{activityToDelete?.titulo}"</strong>? Esta ação não pode ser desfeita.
            </DialogContentText>
          ) : activityToDelete ? (
            <Box sx={{ mt: 0.5 }}>
              <DialogContentText sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 1.5 }}>
                A atividade <strong>"{activityToDelete.titulo}"</strong> não pode ser excluída.
              </DialogContentText>
              <Alert
                severity="info"
                icon={<WarningAmberRoundedIcon sx={{ color: isDark ? '#94A3B8' : '#64748B' }} />}
                sx={{
                  borderRadius: 2,
                  bgcolor: isDark ? alpha('#64748B', 0.15) : '#F1F5F9',
                  color: 'text.secondary',
                  border: '1px solid',
                  borderColor: isDark ? alpha('#94A3B8', 0.2) : '#E2E8F0',
                  '& .MuiAlert-icon': {
                    color: isDark ? '#94A3B8' : '#64748B',
                  },
                }}
              >
                {activityToDelete.status === 'ENCERRADA' && (activityToDelete.totalSubmissoes || 0) > 0
                  ? 'Esta atividade está encerrada e possui submissões registradas.'
                  : (activityToDelete.totalSubmissoes || 0) > 0
                  ? `Esta atividade possui ${activityToDelete.totalSubmissoes} submissão(ões) de alunos registradas.`
                  : 'Esta atividade já foi encerrada.'}
              </Alert>
            </Box>
          ) : null}
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setActivityToDelete(null)}
            disabled={deleting}
            sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
          >
            {activityToDelete && canDeleteActivity(activityToDelete) ? 'Cancelar' : 'Fechar'}
          </Button>
          {activityToDelete && canDeleteActivity(activityToDelete) && (
            <Button
              onClick={handleConfirmDelete}
              variant="contained"
              color="error"
              disabled={deleting}
              startIcon={<DeleteOutlineRoundedIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                boxShadow: 'none',
              }}
            >
              {deleting
                ? 'Excluindo...'
                : activityToDelete.status === 'RASCUNHO'
                ? 'Excluir rascunho'
                : 'Excluir atividade'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

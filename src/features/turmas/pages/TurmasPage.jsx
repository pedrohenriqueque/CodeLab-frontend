/**
 * TurmasPage — Gestão de Turmas e Matrículas de Alunos (Professor).
 *
 * Funcionalidades:
 * - Listagem de todas as turmas cadastradas com total de alunos
 * - Criação de novas turmas neutras
 * - Visualização detalhada dos alunos matriculados
 * - Matrícula de novos alunos a partir da lista geral
 * - Remoção de alunos de uma turma
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  CardActionArea,
  CardActions,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import CloseIcon from '@mui/icons-material/Close';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

import {
  getTurmas,
  getTurmaDetalhe,
  createTurma,
  adicionarAlunosTurma,
  removerAlunoTurma,
  getAlunosDisponiveis,
} from '../api';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';
import { useTurmaContext } from '../context/TurmaContext';

export default function TurmasPage() {
  const navigate = useNavigate();
  const { turmaAtiva, setTurmaAtiva, refreshTurmas: refreshTurmaContext } = useTurmaContext();
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal de Criação de Turma
  const [createOpen, setCreateOpen] = useState(false);
  const [nomeTurma, setNomeTurma] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Drawer de Detalhes da Turma Selecionada
  const [selectedTurma, setSelectedTurma] = useState(null);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);
  const [turmaDetalhes, setTurmaDetalhes] = useState(null);

  // Diálogo para Matricular Aluno
  const [matricularOpen, setMatricularOpen] = useState(false);
  const [alunosGerais, setAlunosGerais] = useState([]);
  const [alunoSelecionadoUuid, setAlunoSelecionadoUuid] = useState('');
  const [matriculando, setMatriculando] = useState(false);

  // Estado para exclusão de matrícula
  const [removendoAlunoId, setRemovendoAlunoId] = useState(null);

  const { showSuccess, showError } = useSnackbar();

  const fetchTurmas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTurmas();
      setTurmas(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao carregar turmas');
      setTurmas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTurmas();
  }, [fetchTurmas]);

  const handleOpenDetalhes = async (turma) => {
    setSelectedTurma(turma);
    setLoadingDetalhes(true);
    try {
      const data = await getTurmaDetalhe(turma.uuid);
      setTurmaDetalhes(data);
    } catch (err) {
      showError(err.response?.data?.detail || 'Erro ao carregar alunos da turma');
      setTurmaDetalhes(null);
    } finally {
      setLoadingDetalhes(false);
    }
  };

  const handleCloseDetalhes = () => {
    setSelectedTurma(null);
    setTurmaDetalhes(null);
  };

  const handleCreateTurma = async (e) => {
    e.preventDefault();
    if (!nomeTurma.trim()) return;

    setCreating(true);
    try {
      setCreateError('');
      await createTurma({ nome: nomeTurma.trim() });
      showSuccess(`Turma "${nomeTurma.trim()}" criada com sucesso!`);
      setNomeTurma('');
      setCreateOpen(false);
      await fetchTurmas();
      if (refreshTurmaContext) {
        await refreshTurmaContext();
      }
    } catch (err) {
      const message = err.response?.data?.erro || 'Erro ao criar turma';
      setCreateError(message);
      showError(message);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenMatricular = async () => {
    setMatricularOpen(true);
    setAlunoSelecionadoUuid('');
    try {
      const data = await getAlunosDisponiveis();
      // Filtrar apenas alunos não matriculados nesta turma
      const matriculadosIds = new Set((turmaDetalhes?.alunos || []).map((a) => a.uuid));
      const disponiveis = (Array.isArray(data) ? data : []).filter((a) => !matriculadosIds.has(a.uuid));
      setAlunosGerais(disponiveis);
    } catch {
      setAlunosGerais([]);
    }
  };

  const handleMatricularAluno = async () => {
    if (!alunoSelecionadoUuid || !selectedTurma?.uuid) return;

    setMatriculando(true);
    try {
      const updated = await adicionarAlunosTurma(selectedTurma.uuid, {
        alunoUuid: alunoSelecionadoUuid,
      });
      showSuccess('Aluno matriculado na turma com sucesso!');
      setTurmaDetalhes(updated);
      setMatricularOpen(false);
      await fetchTurmas();
    } catch (err) {
      showError(err.response?.data?.detail || 'Erro ao matricular aluno');
    } finally {
      setMatriculando(false);
    }
  };

  const handleRemoverAluno = async (alunoUuid) => {
    if (!selectedTurma?.uuid) return;

    setRemovendoAlunoId(alunoUuid);
    try {
      await removerAlunoTurma(selectedTurma.uuid, alunoUuid);
      showSuccess('Aluno desmatriculado da turma!');
      // Atualizar lista local de alunos
      setTurmaDetalhes((prev) => ({
        ...prev,
        alunos: (prev?.alunos || []).filter((a) => a.uuid !== alunoUuid),
        totalAlunos: Math.max(0, (prev?.totalAlunos || 1) - 1),
      }));
      await fetchTurmas();
    } catch (err) {
      showError(err.response?.data?.detail || 'Erro ao desmatricular aluno');
    } finally {
      setRemovendoAlunoId(null);
    }
  };

  return (
    <Box className="fade-in">
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em' }}>
            Gestão de Turmas
          </Typography>
          <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
            Organize os alunos em turmas para direcionamento exclusivo de atividades e provas
          </Typography>
        </Box>
        <Button
          id="btn-nova-turma"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setCreateError(''); setNomeTurma(''); setCreateOpen(true); }}
          size="large"
          sx={{ borderRadius: 2.5, px: 3, fontWeight: 700 }}
        >
          Nova Turma
        </Button>
      </Box>

      {/* Alerta de erro */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Grid de Turmas */}
      {loading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2.5 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={140} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
      ) : turmas.length === 0 ? (
        <Card variant="outlined" sx={{ borderRadius: 3, py: 8, textAlign: 'center', backgroundColor: '#FAFCFF' }}>
          <GroupsOutlinedIcon sx={{ fontSize: 56, color: '#94A3B8', mb: 1.5 }} />
          <Typography variant="h6" sx={{ color: '#334155', fontWeight: 600 }}>
            Nenhuma turma cadastrada
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
            Crie sua primeira turma para poder publicar atividades direcionadas aos alunos.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => { setCreateError(''); setNomeTurma(''); setCreateOpen(true); }}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Criar Turma
          </Button>
        </Card>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2.5 }}>
          {turmas.map((t) => {
            const total = t.totalAlunos ?? t.total_alunos ?? 0;
            const isAtiva = turmaAtiva?.uuid === t.uuid;

            const handleAcessarTurma = (e) => {
              e.stopPropagation();
              setTurmaAtiva(t);
              navigate('/atividades');
            };

            return (
              <Card
                key={t.uuid}
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  borderColor: isAtiva ? 'primary.main' : '#E2E8F0',
                  borderWidth: isAtiva ? 2 : 1,
                  boxShadow: isAtiva
                    ? '0 4px 20px -2px rgba(79, 70, 229, 0.15)'
                    : '0 1px 3px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent sx={{ p: 2.5, pb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isAtiva ? 'primary.main' : '#EEF2FF',
                        color: isAtiva ? '#FFFFFF' : '#4F46E5',
                      }}
                    >
                      <SchoolOutlinedIcon sx={{ fontSize: 24 }} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      {isAtiva && (
                        <Chip
                          icon={<CheckCircleRoundedIcon sx={{ fontSize: '1rem !important' }} />}
                          label="Ativa"
                          size="small"
                          color="success"
                          sx={{ fontWeight: 700 }}
                        />
                      )}
                      <Chip
                        label={`${total} ${total === 1 ? 'aluno' : 'alunos'}`}
                        size="small"
                        color={total > 0 ? 'primary' : 'default'}
                        variant="outlined"
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5, fontSize: '1.05rem' }}>
                    {t.nome}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Criada em: {t.createdAt || t.created_at ? new Date(t.createdAt || t.created_at).toLocaleDateString('pt-BR') : '—'}
                  </Typography>
                </CardContent>

                <CardActions sx={{ px: 2.5, pb: 2, pt: 1, justifyContent: 'space-between', borderTop: '1px solid #F1F5F9' }}>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<GroupsOutlinedIcon />}
                    onClick={() => handleOpenDetalhes(t)}
                    sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                  >
                    Alunos ({total})
                  </Button>

                  <Button
                    size="small"
                    variant={isAtiva ? 'outlined' : 'contained'}
                    endIcon={<ArrowForwardRoundedIcon />}
                    onClick={handleAcessarTurma}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                  >
                    {isAtiva ? 'Ver Atividades' : 'Acessar Turma'}
                  </Button>
                </CardActions>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Modal de Criação de Turma */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <Box component="form" onSubmit={handleCreateTurma} noValidate>
          <DialogTitle sx={{ fontWeight: 700 }}>Nova Turma</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Informe o nome da turma para agrupar os alunos (ex: Algoritmos - Turma A, Estruturas de Dados 2024.1).
            </Typography>
            {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}
            <TextField
              label="Nome da Turma"
              value={nomeTurma}
              onChange={(e) => setNomeTurma(e.target.value)}
              required
              fullWidth
              autoFocus
              placeholder="Ex: Programação I - Turma 01"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setCreateOpen(false)} disabled={creating} sx={{ textTransform: 'none' }}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={creating || !nomeTurma.trim()}
              startIcon={creating ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              {creating ? 'Criando...' : 'Criar Turma'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Drawer com Alunos da Turma */}
      <Drawer
        anchor="right"
        open={!!selectedTurma}
        onClose={handleCloseDetalhes}
        PaperProps={{ sx: { width: { xs: '100%', sm: 540 }, p: 3 } }}
      >
        {selectedTurma && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Drawer Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>
                  {selectedTurma.nome}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {turmaDetalhes?.alunos?.length || 0} alunos matriculados
                </Typography>
              </Box>
              <IconButton onClick={handleCloseDetalhes} size="small">
                <CloseIcon />
              </IconButton>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Ações do Drawer */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<PersonAddAlt1OutlinedIcon />}
                onClick={handleOpenMatricular}
                sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
              >
                Matricular Aluno
              </Button>
            </Box>

            {/* Lista de Alunos */}
            {loadingDetalhes ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <CircularProgress size={32} />
              </Box>
            ) : !turmaDetalhes?.alunos?.length ? (
              <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                Nenhum aluno matriculado nesta turma ainda. Clique em "Matricular Aluno" para adicionar alunos.
              </Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, flexGrow: 1 }}>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Nome</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Matrícula</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Ação</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {turmaDetalhes.alunos.map((aluno) => (
                      <TableRow key={aluno.uuid} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
                            {aluno.nome}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {aluno.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={aluno.matricula || '—'} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Desmatricular Aluno">
                            <IconButton
                              size="small"
                              color="error"
                              disabled={removendoAlunoId === aluno.uuid}
                              onClick={() => handleRemoverAluno(aluno.uuid)}
                            >
                              <PersonRemoveOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Drawer>

      {/* Modal para Matricular Aluno */}
      <Dialog
        open={matricularOpen}
        onClose={() => setMatricularOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Matricular Aluno na Turma</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Selecione um aluno cadastrado para matricular na turma <strong>{selectedTurma?.nome}</strong>:
          </Typography>
          {alunosGerais.length === 0 ? (
            <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
              Todos os alunos já estão matriculados nesta turma.
            </Alert>
          ) : (
            <TextField
              label="Aluno"
              select
              value={alunoSelecionadoUuid}
              onChange={(e) => setAlunoSelecionadoUuid(e.target.value)}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            >
              {alunosGerais.map((a) => (
                <MenuItem key={a.uuid} value={a.uuid}>
                  {a.nome} ({a.matricula || a.email})
                </MenuItem>
              ))}
            </TextField>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setMatricularOpen(false)} disabled={matriculando} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            onClick={handleMatricularAluno}
            variant="contained"
            disabled={matriculando || !alunoSelecionadoUuid}
            startIcon={matriculando ? <CircularProgress size={16} color="inherit" /> : <PersonAddAlt1OutlinedIcon />}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            {matriculando ? 'Matriculando...' : 'Matricular'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

// Ícones Material UI
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

import { createTurma, ingressarTurma } from '../api';
import { useTurmaContext } from '../context/TurmaContext';
import { useAuth } from '../../auth/hooks/useAuthProvider';
import LogoutConfirmDialog from '../../../shared/components/LogoutConfirmDialog';

// Paleta de cores para os badges dos cards (índigo para Card 1, menta para Card 2, etc.)
const CARD_PALETTES = [
  { bg: '#EEF2FF', icon: '#4F46E5' }, // Soft Purple / Indigo (Card 1: Algoritmos)
  { bg: '#ECFDF5', icon: '#10B981' }, // Soft Mint / Green (Card 2: EDA)
  { bg: '#EFF6FF', icon: '#2563EB' }, // Soft Blue
  { bg: '#FFF7ED', icon: '#EA580C' }, // Soft Amber
  { bg: '#FAF5FF', icon: '#9333EA' }, // Soft Violet
];

/**
 * Função utilitária para formatar a data de início das aulas da turma
 * Suporta formatos ISO (YYYY-MM-DD, UTC strings), camelCase (inicioAulas) e snake_case (inicio_aulas).
 */
export function formatInicioAulas(turma) {
  const raw =
    turma?.inicioAulas ??
    turma?.inicio_aulas ??
    turma?.dataInicio ??
    turma?.data_inicio ??
    turma?.inicioEm ??
    turma?.inicio_em ??
    turma?.createdAt ??
    turma?.created_at;

  if (!raw) return '—';

  const str = String(raw).trim();

  // Se já estiver no formato brasileiro DD/MM/AAAA
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return str;
  }

  // Se for formato ISO simples YYYY-MM-DD (evitar timezone offset)
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const [ano, mes, dia] = str.split('T')[0].split('-');
    return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
  }

  // Caso seja Date ou ISO string completo
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  } catch {}

  return str;
}

const isProfessorProfile = (user) =>
  String(user?.perfil || user?.tipo || 'PROFESSOR').toUpperCase() === 'PROFESSOR';

export default function MinhasTurmasPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { turmas: apiTurmas, setTurmaAtiva, refreshTurmas, loadingTurmas } = useTurmaContext();

  const professor = isProfessorProfile(user);
  const isStudent = !professor;
  const displayName = user?.nome || 'Ana Souza';
  const displayRole = professor ? 'Professora' : 'Aluno';

  // Iniciais do avatar
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || 'AS';

  // Estados locais
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [codigoIngresso, setCodigoIngresso] = useState('');
  const [joining, setJoining] = useState(false);

  // Form de criação
  const [nomeNovaTurma, setNomeNovaTurma] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createdTurmaSuccess, setCreatedTurmaSuccess] = useState(null);

  // Header Dropdowns
  const [anchorUser, setAnchorUser] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Toast / Feedback de cópia
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [copiedCodes, setCopiedCodes] = useState({});

  // A tela sempre representa as turmas retornadas pela API.
  const turmasList = useMemo(() => {
    return Array.isArray(apiTurmas) ? apiTurmas : [];
  }, [apiTurmas]);

  // Filtro de busca por nome ou código
  const filteredTurmas = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return turmasList;
    return turmasList.filter(
      (t) =>
        t.nome?.toLowerCase().includes(q) ||
        (t.codigo && t.codigo.toLowerCase().includes(q))
    );
  }, [turmasList, search]);

  const handleEnterTurma = (turma) => {
    setTurmaAtiva(turma);
    navigate(professor ? '/dashboard' : '/aluno/dashboard');
  };

  const handleCopyCode = async (codigo, e) => {
    if (e) e.stopPropagation();
    if (!codigo) return;
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiedCodes((prev) => ({ ...prev, [codigo]: true }));
      setToast({ open: true, message: `Código ${codigo} copiado para a área de transferência!`, severity: 'success' });
      setTimeout(() => {
        setCopiedCodes((prev) => ({ ...prev, [codigo]: false }));
      }, 2000);
    } catch {
      setToast({ open: true, message: 'Não foi possível copiar o código.', severity: 'error' });
    }
  };

  const handleCreateTurma = async (e) => {
    if (e) e.preventDefault();
    const nomeTrim = nomeNovaTurma.trim();
    if (!nomeTrim) {
      setCreateError('O nome da turma é obrigatório.');
      return;
    }

    setCreating(true);
    setCreateError('');

    try {
      const nova = await createTurma({ nome: nomeTrim });
      await refreshTurmas();

      setCreatedTurmaSuccess(nova);
      setToast({ open: true, message: `Turma "${nova.nome}" criada com sucesso!`, severity: 'success' });
    } catch (err) {
      setCreateError(err?.response?.data?.detail || err?.message || 'Erro ao criar turma.');
    } finally {
      setCreating(false);
    }
  };

  const handleCloseCreateModal = () => {
    if (creating) return;
    setShowCreateModal(false);
    setNomeNovaTurma('');
    setCreateError('');
    setCreatedTurmaSuccess(null);
  };

  const handleJoinTurma = async (e) => {
    if (e) e.preventDefault();
    const codeTrim = codigoIngresso.trim();
    if (!codeTrim) return;

    setJoining(true);
    try {
      const turma = await ingressarTurma(codeTrim);
      await refreshTurmas();
      setShowJoinModal(false);
      setCodigoIngresso('');
      setToast({ open: true, message: `Você entrou na turma ${turma.nome}!`, severity: 'success' });
    } catch (err) {
      setToast({ open: true, message: err?.response?.data?.detail || err?.message || 'Não foi possível ingressar.', severity: 'error' });
    } finally {
      setJoining(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Header Superior */}
      <Box
        component="header"
        sx={{
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          px: { xs: 2, sm: 4, md: 6 },
          py: 1.5,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        }}
      >
        <Box
          sx={{
            maxWidth: 1120,
            mx: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo CodeLab */}
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ cursor: 'pointer', userSelect: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', color: '#1D64F2' }}>
              <CodeRoundedIcon sx={{ fontSize: 32 }} />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#0F172A',
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                }}
              >
                CodeLab
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500, lineHeight: 1.1 }}>
                C para ir mais longe
              </Typography>
            </Box>
          </Stack>

          {/* Perfil do Usuário */}
          <Stack direction="row" spacing={2} alignItems="center">
            {/* Avatar e Perfil */}
            <Box
              onClick={(e) => setAnchorUser(e.currentTarget)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                cursor: 'pointer',
                py: 0.5,
                px: 1,
                borderRadius: '10px',
                transition: 'background-color 0.2s ease',
                '&:hover': { bgcolor: '#F8FAFC' },
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: '#2563EB',
                  color: '#FFFFFF',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  boxShadow: '0 2px 4px rgba(37,99,235,0.2)',
                }}
              >
                {initials}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', lineHeight: 1.2 }}>
                  Olá, {displayName}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 400, lineHeight: 1.2 }}>
                  {displayRole}
                </Typography>
              </Box>
              <KeyboardArrowDownRoundedIcon sx={{ color: '#64748B', fontSize: 18 }} />
            </Box>

            {/* Menu Dropdown */}
            <Menu
              anchorEl={anchorUser}
              open={Boolean(anchorUser)}
              onClose={() => setAnchorUser(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{
                sx: {
                  width: 210,
                  borderRadius: '12px',
                  mt: 1,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                  border: '1px solid #E2E8F0',
                },
              }}
            >
              <MenuItem disabled sx={{ opacity: '1 !important' }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F172A' }}>
                    {displayName}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>
                    {user?.email || 'ana.souza@universidade.br'}
                  </Typography>
                </Box>
              </MenuItem>
              <Divider sx={{ my: 0.5 }} />
              <MenuItem
                onClick={() => {
                  setAnchorUser(null);
                  setShowLogoutConfirm(true);
                }}
                sx={{ fontSize: '0.875rem', color: '#DC2626', py: 1 }}
              >
                <LogoutRoundedIcon sx={{ fontSize: 18, mr: 1.5, color: '#DC2626' }} />
                Sair da conta
              </MenuItem>
            </Menu>
          </Stack>
        </Box>
      </Box>

      {/* 2. Conteúdo Principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          maxWidth: 1120,
          width: '100%',
          mx: 'auto',
          px: { xs: 2, sm: 4, md: 6 },
          py: { xs: 4, sm: 5 },
        }}
      >
        {/* Título e Ação Superior */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: '1.75rem', sm: '2rem' },
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.025em',
                lineHeight: 1.2,
              }}
            >
              Minhas turmas
            </Typography>
            <Typography sx={{ fontSize: '0.95rem', color: '#64748B', mt: 0.75 }}>
              Escolha uma turma para continuar.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5}>
            {!professor && (
              <Button
                variant="outlined"
                onClick={() => setShowJoinModal(true)}
                sx={{
                  borderColor: '#CBD5E1',
                  color: '#1E293B',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  px: 2.5,
                  py: 1.1,
                  borderRadius: '8px',
                  '&:hover': { borderColor: '#94A3B8', bgcolor: '#F1F5F9' },
                }}
              >
                Ingressar em turma
              </Button>
            )}

            {professor && (
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon sx={{ fontSize: 20 }} />}
                onClick={() => setShowCreateModal(true)}
                sx={{
                  bgcolor: '#1D64F2',
                  color: '#FFFFFF',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  px: 2.75,
                  py: 1.1,
                  borderRadius: '8px',
                  boxShadow: '0 1px 2px rgba(29, 100, 242, 0.1)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: '#1A56DB',
                    boxShadow: '0 4px 12px rgba(29, 100, 242, 0.25)',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                Criar turma
              </Button>
            )}
          </Stack>
        </Stack>

        {/* Barra de Busca */}
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            placeholder="Buscar por nome da turma ou código de ingresso..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: '#94A3B8', fontSize: 22, ml: 0.5 }} />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch('')}>
                    <ClearRoundedIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#FFFFFF',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                transition: 'all 0.2s ease',
                '& fieldset': { border: 'none' },
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                },
                '&.Mui-focused': {
                  boxShadow: '0 0 0 2px rgba(29, 100, 242, 0.15)',
                  border: '1px solid #1D64F2',
                },
                '& input': {
                  py: 1.4,
                  fontSize: '0.925rem',
                  color: '#0F172A',
                  '&::placeholder': {
                    color: '#94A3B8',
                    opacity: 1,
                  },
                },
              },
            }}
          />
        </Box>

        {/* Grade de Turmas e Empty State */}
        {loadingTurmas && turmasList.length === 0 ? (
          <Box sx={{ py: 10, textAlign: 'center' }}>
            <CircularProgress sx={{ color: '#1D64F2' }} />
          </Box>
        ) : filteredTurmas.length > 0 ? (
          <Stack spacing={4}>
            {/* Grade de Cards de Turmas (2 colunas no desktop) */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 3,
              }}
            >
              {filteredTurmas.map((turma, index) => {
                const palette = CARD_PALETTES[index % CARD_PALETTES.length];
                const isCopied = Boolean(copiedCodes[turma.codigo]);
                const totalAlunos = turma.totalAlunos ?? turma.total_alunos ?? 0;
                const totalAtividades = turma.totalAtividades ?? turma.total_atividades ?? 0;
                const dataInicio = formatInicioAulas(turma);

                return (
                  <Card
                    key={turma.uuid}
                    elevation={0}
                    sx={{
                      bgcolor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '16px',
                      p: { xs: 2.5, sm: 3 },
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.06), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
                        borderColor: '#CBD5E1',
                      },
                    }}
                  >
                    <Box>
                      {/* Topo do Card: Ícone e Título com Código */}
                      <Stack direction="row" spacing={2.5} alignItems="flex-start">
                        {/* Badge do Ícone Pastel */}
                        <Box
                          sx={{
                            width: 52,
                            height: 52,
                            minWidth: 52,
                            borderRadius: '12px',
                            bgcolor: palette.bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: palette.icon,
                          }}
                        >
                          <GroupsRoundedIcon sx={{ fontSize: 28 }} />
                        </Box>

                        {/* Nome da Turma e Código */}
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontSize: { xs: '1.05rem', sm: '1.15rem' },
                              fontWeight: 700,
                              color: '#0F172A',
                              letterSpacing: '-0.01em',
                              lineHeight: 1.3,
                              mb: 0.75,
                            }}
                            noWrap
                          >
                            {turma.nome}
                          </Typography>

                          <Stack direction="row" alignItems="center" spacing={0.75}>
                            <Typography sx={{ fontSize: '0.85rem', color: '#64748B' }}>
                              Código de ingresso:
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: '0.875rem',
                                fontWeight: 700,
                                color: '#1E293B',
                                letterSpacing: '0.04em',
                              }}
                            >
                              {turma.codigo || '—'}
                            </Typography>
                            {turma.codigo && (
                              <Tooltip title={isCopied ? 'Copiado!' : 'Copiar código'}>
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleCopyCode(turma.codigo, e)}
                                  sx={{
                                    p: 0.5,
                                    color: isCopied ? '#10B981' : '#64748B',
                                    transition: 'color 0.2s ease',
                                    '&:hover': { color: '#0F172A', bgcolor: '#F1F5F9' },
                                  }}
                                >
                                  {isCopied ? (
                                    <CheckRoundedIcon sx={{ fontSize: 16 }} />
                                  ) : (
                                    <ContentCopyOutlinedIcon sx={{ fontSize: 16 }} />
                                  )}
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </Box>
                      </Stack>

                      {/* Métricas: 3 Colunas (Alunos, Atividades, Início das Aulas) */}
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{
                          mt: 4,
                          pt: 2.5,
                          borderTop: '1px solid #F1F5F9',
                        }}
                      >
                        {/* Alunos */}
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                          <PeopleAltOutlinedIcon sx={{ fontSize: 20, color: '#64748B' }} />
                          <Box>
                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.1 }}>
                              {totalAlunos}
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>
                              alunos
                            </Typography>
                          </Box>
                        </Stack>

                        {/* Atividades */}
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, pl: 1 }}>
                          <AssignmentOutlinedIcon sx={{ fontSize: 20, color: '#64748B' }} />
                          <Box>
                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.1 }}>
                              {totalAtividades}
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>
                              atividades
                            </Typography>
                          </Box>
                        </Stack>

                        {/* Início das Aulas */}
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1.2, pl: 1 }}>
                          <CalendarTodayOutlinedIcon sx={{ fontSize: 19, color: '#64748B' }} />
                          <Box>
                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.1 }}>
                              {dataInicio}
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>
                              início das aulas
                            </Typography>
                          </Box>
                        </Stack>
                      </Stack>
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      endIcon={<ArrowForwardRoundedIcon />}
                      onClick={() => handleEnterTurma(turma)}
                      sx={{ mt: 3, textTransform: 'none', fontWeight: 700 }}
                    >
                      Entrar na turma
                    </Button>
                  </Card>
                );
              })}
            </Box>
          </Stack>
        ) : search ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography color="text.secondary">Nenhuma turma encontrada para a busca.</Typography>
          </Box>
        ) : (
          <Box
            sx={{
              p: { xs: 3, sm: 4 }, bgcolor: '#FFFFFF', borderRadius: '16px',
              border: '2px dashed #CBD5E1', textAlign: 'center', maxWidth: 600, mx: 'auto',
            }}
          >
            <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: '#EFF6FF', color: '#1D64F2', display: 'inline-grid', placeItems: 'center', mb: 2 }}>
              {isStudent ? <GroupsRoundedIcon sx={{ fontSize: 32 }} /> : <AddRoundedIcon sx={{ fontSize: 32 }} />}
            </Box>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', mb: 0.75 }}>
              {isStudent ? 'Você ainda não está em nenhuma turma' : 'Você ainda não tem turmas'}
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', color: '#64748B', maxWidth: 420, mx: 'auto', mb: 2.5, lineHeight: 1.5 }}>
              {isStudent
                ? 'Utilize o código de ingresso fornecido pelo seu professor para entrar em uma turma.'
                : 'Crie sua primeira turma para começar a organizar suas atividades e acompanhar o desempenho dos alunos.'}
            </Typography>
            <Button
              variant="contained"
              startIcon={isStudent ? <GroupsRoundedIcon /> : <AddRoundedIcon />}
              onClick={() => (isStudent ? setShowJoinModal(true) : setShowCreateModal(true))}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              {isStudent ? 'Entrar em uma turma' : 'Criar turma'}
            </Button>
          </Box>
        )}
      </Box>

      <Dialog open={showCreateModal} onClose={handleCloseCreateModal} fullWidth maxWidth="xs">
        <Box component="form" onSubmit={handleCreateTurma}>
          <DialogTitle>Criar turma</DialogTitle>
          <DialogContent>
            <TextField autoFocus fullWidth required label="Nome da turma" value={nomeNovaTurma} onChange={(event) => setNomeNovaTurma(event.target.value)} error={Boolean(createError)} helperText={createError} />
            {createdTurmaSuccess && <Alert severity="success" sx={{ mt: 2 }}>Turma criada. Código de ingresso: <strong>{createdTurmaSuccess.codigo}</strong></Alert>}
          </DialogContent>
          <DialogActions><Button onClick={handleCloseCreateModal} disabled={creating}>Cancelar</Button><Button type="submit" variant="contained" disabled={creating}>{creating ? 'Criando...' : 'Criar turma'}</Button></DialogActions>
        </Box>
      </Dialog>

      <Dialog open={showJoinModal} onClose={() => !joining && setShowJoinModal(false)} fullWidth maxWidth="xs">
        <Box component="form" onSubmit={handleJoinTurma}>
          <DialogTitle>Entrar em uma turma</DialogTitle>
          <DialogContent><TextField autoFocus fullWidth required label="Código de ingresso" value={codigoIngresso} onChange={(event) => setCodigoIngresso(event.target.value)} /></DialogContent>
          <DialogActions><Button onClick={() => setShowJoinModal(false)} disabled={joining}>Cancelar</Button><Button type="submit" variant="contained" disabled={joining}>{joining ? 'Entrando...' : 'Entrar'}</Button></DialogActions>
        </Box>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast((current) => ({ ...current, open: false }))}>
        <Alert severity={toast.severity} onClose={() => setToast((current) => ({ ...current, open: false }))}>{toast.message}</Alert>
      </Snackbar>

      <LogoutConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
          navigate('/login');
        }}
      />
    </Box>
  );
}

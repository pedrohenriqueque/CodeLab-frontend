/**
 * AuthPage (Login & Registro) — tela de autenticação centralizada, moderna e acessível.
 *
 * Suporta alternância suave entre 'Entrar' e 'Criar conta' via Tabs ou Query param ?mode=register.
 * Segue as Heurísticas de Nielsen (Visibilidade do status, Prevenção e Tratamento de Erros, Consistência).
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Button,
  Divider,
  Alert,
  Fade,
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import ForgotPasswordForm from '../components/ForgotPasswordForm';
import { useAuth } from '../hooks/useAuthProvider';
import { resetPasswordApi } from '../api';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';

export default function LoginPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = searchParams.get('tab') === 'register' ? 'register' : (searchParams.get('tab') === 'forgot' ? 'forgot' : 'login');
  const [authMode, setAuthMode] = useState(initialMode); // 'login' | 'register' | 'forgot'

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { login, register, isAuthenticated, isProfessor } = useAuth();
  const { showSuccess } = useSnackbar();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || (isProfessor ? '/dashboard' : '/aluno/atividades');

  // Redireciona caso já esteja autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Sincroniza tab com URL se mudar via props/navegação
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'register') setAuthMode('register');
    else if (tab === 'forgot') setAuthMode('forgot');
    else if (!tab) setAuthMode('login');
  }, [searchParams]);

  const switchMode = (mode) => {
    setAuthMode(mode);
    setError('');
    setSuccessMessage('');
    if (mode === 'register') setSearchParams({ tab: 'register' });
    else if (mode === 'forgot') setSearchParams({ tab: 'forgot' });
    else setSearchParams({});
  };

  const handleLogin = async (email, senha) => {
    setLoading(true);
    setError('');
    try {
      const user = await login(email, senha);
      showSuccess(`Bem-vindo de volta, ${user.nome}!`);
      const target = user.tipo === 'professor' ? '/dashboard' : '/aluno/atividades';
      navigate(location.state?.from?.pathname || target, { replace: true });
    } catch (err) {
      setError(err.message || 'Erro ao realizar login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (formData) => {
    setLoading(true);
    setError('');
    try {
      const user = await register(formData);
      showSuccess(`Conta criada com sucesso! Seja bem-vindo, ${user.nome}!`);
      navigate('/aluno/atividades', { replace: true });
    } catch (err) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (email, novaSenha) => {
    setLoading(true);
    setError('');
    try {
      const res = await resetPasswordApi(email, novaSenha);
      showSuccess(res.message || 'Senha redefinida com sucesso! Faça login com a nova senha.');
      setSuccessMessage('Senha atualizada com sucesso! Você já pode entrar com sua nova senha.');
      setAuthMode('login');
      setSearchParams({});
    } catch (err) {
      setError(err.message || 'Erro ao redefinir a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #E3F2FD 0%, #F5F7FA 50%, #E0F2F1 100%)',
        p: { xs: 2, sm: 3 },
      }}
    >
      {/* Botão de retorno à tela inicial */}
      <Box sx={{ maxWidth: 480, width: '100%', mb: 1.5, display: 'flex', justifyContent: 'flex-start' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          size="small"
          sx={{
            color: 'text.secondary',
            fontWeight: 600,
            '&:hover': { bgcolor: 'action.hover', color: 'primary.main' },
          }}
        >
          Voltar para o início
        </Button>
      </Box>

      <Card
        sx={{
          maxWidth: 480,
          width: '100%',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 12px 32px rgba(21,101,192,0.08), 0 4px 12px rgba(0,0,0,0.04)',
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Header Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 38,
                height: 38,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                boxShadow: '0 4px 12px rgba(21,101,192,0.25)',
              }}
            >
              <CodeIcon sx={{ fontSize: 24 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
              Code<Box component="span" sx={{ color: 'primary.main' }}>Lab</Box>
            </Typography>
          </Box>
          
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mb: 2.5 }}
          >
            Plataforma de avaliação automatizada de código C
          </Typography>

          {/* Navigation Tabs (Login / Register) - Exibe apenas se não estiver em 'forgot' */}
          {authMode !== 'forgot' ? (
            <Tabs
              value={authMode === 'register' ? 1 : 0}
              onChange={(e, val) => switchMode(val === 1 ? 'register' : 'login')}
              variant="fullWidth"
              sx={{
                mb: 3,
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  textTransform: 'none',
                  pb: 1.5,
                },
              }}
            >
              <Tab label="Entrar" id="auth-tab-login" />
              <Tab label="Criar conta de aluno" id="auth-tab-register" />
            </Tabs>
          ) : (
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                Recuperar e Redefinir Senha
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Informe o seu e-mail cadastrado e crie uma nova senha de acesso.
              </Typography>
            </Box>
          )}

          {/* Success Message if any */}
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
              {successMessage}
            </Alert>
          )}

          {/* Modo: Login */}
          {authMode === 'login' && (
            <Fade in={authMode === 'login'} timeout={300}>
              <Box>
                <LoginForm
                  onSubmit={handleLogin}
                  loading={loading}
                  error={error}
                  onForgotPassword={() => switchMode('forgot')}
                />

                <Divider sx={{ my: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Ou
                  </Typography>
                </Divider>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Não tem uma conta ainda?{' '}
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => switchMode('register')}
                      sx={{ fontWeight: 700, p: 0, minWidth: 'auto', verticalAlign: 'baseline' }}
                    >
                      Cadastre-se como aluno
                    </Button>
                  </Typography>
                </Box>

                {/* Hint para testes */}
                <Box sx={{ mt: 3, p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                  <Typography variant="caption" color="text.secondary" component="div" sx={{ fontWeight: 700 }}>
                    Acesso rápido de teste (senha: 123456):
                  </Typography>
                  <Typography variant="caption" color="text.secondary" component="div">
                    Professor: <strong>ana.souza@universidade.br</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" component="div">
                    Aluno: <strong>pedro.lacerda@aluno.universidade.br</strong>
                  </Typography>
                </Box>
              </Box>
            </Fade>
          )}

          {/* Modo: Registro */}
          {authMode === 'register' && (
            <Fade in={authMode === 'register'} timeout={300}>
              <Box>
                <RegisterForm onSubmit={handleRegister} loading={loading} error={error} />

                <Divider sx={{ my: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Já possui cadastro?
                  </Typography>
                </Divider>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Já tem uma conta no CodeLab?{' '}
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => switchMode('login')}
                      sx={{ fontWeight: 700, p: 0, minWidth: 'auto', verticalAlign: 'baseline' }}
                    >
                      Fazer login
                    </Button>
                  </Typography>
                </Box>
              </Box>
            </Fade>
          )}

          {/* Modo: Esqueceu a Senha */}
          {authMode === 'forgot' && (
            <Fade in={authMode === 'forgot'} timeout={300}>
              <Box>
                <ForgotPasswordForm
                  onSubmit={handleResetPassword}
                  loading={loading}
                  error={error}
                />

                <Divider sx={{ my: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Lembrou da senha?
                  </Typography>
                </Divider>

                <Box sx={{ textAlign: 'center' }}>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => switchMode('login')}
                    sx={{ fontWeight: 700 }}
                  >
                    Voltar para o Login
                  </Button>
                </Box>
              </Box>
            </Fade>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

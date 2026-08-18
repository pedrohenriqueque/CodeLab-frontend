/**
 * LoginPage — tela de login centralizada, sem AppBar/Sidebar.
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Divider } from '@mui/material';
import TerminalIcon from '@mui/icons-material/Terminal';

import LoginForm from '../components/LoginForm';
import { useAuth } from '../hooks/useAuthProvider';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (email, senha) => {
    setLoading(true);
    setError('');
    try {
      await login(email, senha);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #E3F2FD 0%, #F5F7FA 50%, #E0F2F1 100%)',
        p: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 420,
          width: '100%',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 8px 32px rgba(21,101,192,0.08), 0 4px 12px rgba(0,0,0,0.04)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
            <TerminalIcon sx={{ color: 'primary.main', fontSize: 36 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
              CodeLab
            </Typography>
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mb: 3 }}
          >
            Plataforma de avaliação automática de código C
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {/* Form */}
          <LoginForm onSubmit={handleLogin} loading={loading} error={error} />

          {/* Hint para dev */}
          <Box sx={{ mt: 3, p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
            <Typography variant="caption" color="text.secondary" component="div">
              <strong>Acesso para desenvolvimento (senha: 123456):</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary" component="div">
              Professor: ana.souza@universidade.br
            </Typography>
            <Typography variant="caption" color="text.secondary" component="div">
              Aluno: pedro.lacerda@aluno.universidade.br
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

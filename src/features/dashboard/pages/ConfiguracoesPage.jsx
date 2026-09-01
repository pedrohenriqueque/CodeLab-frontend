import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Divider,
  Switch,
  FormControlLabel,
  Button,
  TextField,
  Grid,
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';

import { useAuth } from '../../auth/hooks/useAuthProvider';
import { useThemeMode } from '../../../shared/theme/ThemeContext';

export default function ConfiguracoesPage() {
  const { user, isProfessor } = useAuth();
  const { mode, toggleColorMode } = useThemeMode();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 900 }}>
      {/* Header */}
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
          Configurações
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Gerencie seu perfil, preferências da plataforma e notificações
        </Typography>
      </Box>

      {/* Profile Card */}
      <Card sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 3 }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: '#4F46E5', fontSize: '1.4rem', fontWeight: 700 }}>
            {user?.nome ? user.nome.charAt(0).toUpperCase() : 'P'}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {user?.nome || 'Prof. Pedro Henrique'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {user?.email || 'professor@universidade.edu.br'}
            </Typography>
            <Typography variant="caption" sx={{ display: 'inline-block', mt: 0.5, px: 1.2, py: 0.2, bgcolor: '#EEF2FF', color: '#4F46E5', borderRadius: 1.5, fontWeight: 600 }}>
              {isProfessor ? 'Professor / Administrador' : 'Aluno'}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Nome Completo" defaultValue={user?.nome || 'Prof. Pedro Henrique'} size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="E-mail Institucional" defaultValue={user?.email || 'professor@universidade.edu.br'} size="small" disabled />
          </Grid>
        </Grid>
      </Card>

      {/* Appearance & Preferences */}
      <Card sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Aparência e Interface
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {mode === 'dark' ? <DarkModeIcon sx={{ color: '#4F46E5' }} /> : <LightModeIcon sx={{ color: '#F59E0B' }} />}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Modo Escuro</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Alterne entre o tema claro e escuro para maior conforto visual
              </Typography>
            </Box>
          </Box>
          <Switch checked={mode === 'dark'} onChange={toggleColorMode} color="primary" />
        </Box>
      </Card>

      {/* Notifications */}
      <Card sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Notificações
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Avisos de novas submissões</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Receber notificação quando um aluno submeter uma atividade</Typography>
            </Box>
            <Switch defaultChecked color="primary" />
          </Box>
          <Divider />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Resumo Semanal</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Receber estatísticas semanais de desempenho por e-mail</Typography>
            </Box>
            <Switch defaultChecked color="primary" />
          </Box>
        </Box>
      </Card>
    </Box>
  );
}

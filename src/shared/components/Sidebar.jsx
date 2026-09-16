/**
 * Sidebar — Menu lateral estilo CodeGrade.
 *
 * Implementa exatamente a sidebar apresentada no mockup:
 * - Topo com logo CodeGrade e ícone </> em roxo/azul
 * - Itens: Início, Atividades, Submissões, Alunos, Resultados, Configurações
 * - Item selecionado com fundo em pill suave (#EEF2FF) e cor primária (#4F46E5)
 * - Rodapé com avatar em círculo ("PH"), nome "Prof. Pedro Henrique" e cargo "Professor"
 * - Suporte a drawer temporário no mobile e permanente no desktop
 */

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  Tooltip,
} from '@mui/material';

// Icons
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import PeopleOutlineRoundedIcon from '@mui/icons-material/PeopleOutlineRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import TerminalOutlinedIcon from '@mui/icons-material/TerminalOutlined';
import FunctionsOutlinedIcon from '@mui/icons-material/FunctionsOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import KeyboardDoubleArrowLeftRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowLeftRounded';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

import { useAuth } from '../../features/auth/hooks/useAuthProvider';
import { useThemeMode } from '../theme/ThemeContext';

export const DRAWER_WIDTH = 250;

export const MENU_PROFESSOR = [
  { label: 'Início', icon: <HomeOutlinedIcon />, path: '/dashboard' },
  { label: 'Atividades', icon: <AssignmentOutlinedIcon />, path: '/atividades' },
  { label: 'Biblioteca', icon: <FunctionsOutlinedIcon />, path: '/funcoes' },
  { label: 'Submissões', icon: <FactCheckOutlinedIcon />, path: '/submissoes' },
  { label: 'Alunos', icon: <PeopleOutlineRoundedIcon />, path: '/alunos' },
  { label: 'Resultados', icon: <BarChartRoundedIcon />, path: '/resultados' },
  { label: 'Configurações', icon: <SettingsOutlinedIcon />, path: '/configuracoes' },
];

export const MENU_ALUNO = [
  { label: 'Início', icon: <HomeOutlinedIcon />, path: '/aluno/dashboard' },
  { label: 'Atividades', icon: <AssignmentOutlinedIcon />, path: '/aluno/atividades' },
  { label: 'Histórico', icon: <HistoryOutlinedIcon />, path: '/aluno/historico' },
  { label: 'Submissões', icon: <FactCheckOutlinedIcon />, path: '/aluno/submissoes' },
  { label: 'Playground', icon: <TerminalOutlinedIcon />, path: '/aluno/sandbox' },
  { label: 'Configurações', icon: <SettingsOutlinedIcon />, path: '/configuracoes' },
];

function getInitials(name) {
  if (!name) return 'PH';
  const clean = name.replace(/^prof(a)?\.?\s+/i, '').trim();
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase() || 'PH';
}

export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { mode, toggleColorMode } = useThemeMode();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isProfessor, logout } = useAuth();

  const [anchorEl, setAnchorEl] = useState(null);

  const menuItems = isProfessor ? MENU_PROFESSOR : MENU_ALUNO;

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  const isItemActive = (itemPath) => {
    const current = location.pathname;
    if (itemPath === '/dashboard') {
      return current === '/dashboard' || current === '/';
    }
    if (itemPath === '/aluno/dashboard') {
      return current === '/aluno/dashboard' || current === '/';
    }
    if (itemPath === '/submissoes') {
      return current.includes('/submissoes');
    }
    if (itemPath === '/atividades') {
      return current.startsWith('/atividades') && !current.includes('/submissoes');
    }
    if (itemPath === '/aluno/atividades') {
      return current.startsWith('/aluno/atividades') && !current.includes('/submissoes');
    }
    return current.startsWith(itemPath);
  };

  const displayName = user?.nome || (isProfessor ? 'Prof. Pedro Henrique' : 'Aluno CodeGrade');
  const displayRole = user?.tipo === 'professor' ? 'Professor' : (user?.tipo === 'aluno' ? 'Aluno' : 'Professor');
  const initials = getInitials(displayName);

  const drawerContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'background.paper',
        py: 3,
        px: 2,
        userSelect: 'none',
      }}
    >
      {/* Top Header: Logo + Toggle */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1,
          mb: 3.5,
        }}
      >
        <Box
          onClick={() => {
            navigate(isProfessor ? '/dashboard' : '/aluno/dashboard');
            if (isMobile) onClose?.();
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            cursor: 'pointer',
          }}
        >
          {/* Logo Code icon */}
          <Box
            sx={{
              color: '#4F46E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.25rem',
              fontFamily: 'monospace',
              letterSpacing: '-1.5px',
            }}
          >
            &lt;/&gt;
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              fontSize: '1.18rem',
              color: 'text.primary',
              letterSpacing: '-0.02em',
            }}
          >
            CodeGrade
          </Typography>
        </Box>

        {/* Collapse toggle icon */}
        <Tooltip title="Recolher menu">
          <IconButton
            size="small"
            onClick={isMobile ? onClose : undefined}
            sx={{
              color: 'text.secondary',
              p: 0.5,
              '&:hover': { color: 'text.primary' },
            }}
          >
            <KeyboardDoubleArrowLeftRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Navigation List */}
      <List
        sx={{
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.75,
          flex: 1,
        }}
      >
        {menuItems.map((item) => {
          const active = isItemActive(item.path);

          return (
            <ListItemButton
              key={item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) onClose?.();
              }}
              selected={active}
              disableRipple
              sx={{
                borderRadius: '12px',
                py: 1.1,
                px: 1.75,
                color: active
                  ? '#4F46E5'
                  : 'text.secondary',
                backgroundColor: active
                  ? (mode === 'light' ? '#EEF2FF' : 'rgba(79, 70, 229, 0.18)')
                  : 'transparent',
                transition: 'all 0.15s ease',
                '&:hover': {
                  backgroundColor: active
                    ? (mode === 'light' ? '#E0E7FF' : 'rgba(79, 70, 229, 0.25)')
                    : (mode === 'light' ? '#F8FAFC' : 'rgba(255, 255, 255, 0.05)'),
                  color: active ? '#4338CA' : 'text.primary',
                  '& .MuiListItemIcon-root': {
                    color: active ? '#4338CA' : '#4F46E5',
                  },
                },
                '&.Mui-selected': {
                  backgroundColor: mode === 'light' ? '#EEF2FF' : 'rgba(79, 70, 229, 0.18)',
                  color: '#4F46E5',
                  '& .MuiListItemIcon-root': {
                    color: '#4F46E5',
                  },
                  '&:hover': {
                    backgroundColor: mode === 'light' ? '#E0E7FF' : 'rgba(79, 70, 229, 0.25)',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 36,
                  color: active ? '#4F46E5' : 'text.secondary',
                  transition: 'color 0.15s ease',
                  '& .MuiSvgIcon-root': {
                    fontSize: 21,
                  },
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: '0.885rem',
                      fontWeight: active ? 600 : 500,
                      letterSpacing: '-0.01em',
                    },
                  },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* User Profile Card at Bottom */}
      <Box sx={{ mt: 'auto', pt: 2 }}>
        <Box
          onClick={handleMenuOpen}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1,
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
            '&:hover': {
              backgroundColor: mode === 'light' ? '#F8FAFC' : 'rgba(255, 255, 255, 0.05)',
            },
          }}
        >
          <Avatar
            sx={{
              width: 38,
              height: 38,
              bgcolor: '#3B49DF',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.875rem',
              flexShrink: 0,
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                fontSize: '0.835rem',
                lineHeight: 1.25,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {displayName}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: '0.75rem',
                fontWeight: 400,
                display: 'block',
                lineHeight: 1.2,
                mt: 0.25,
              }}
            >
              {displayRole}
            </Typography>
          </Box>
        </Box>

        {/* User context menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              minWidth: 210,
              borderRadius: 3,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              mt: -1,
            },
          }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          transformOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {displayName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              {user?.email || 'usuario@universidade.edu.br'}
            </Typography>
          </Box>
          <MenuItem
            onClick={() => {
              toggleColorMode();
              handleMenuClose();
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText primary={mode === 'dark' ? 'Modo Claro' : 'Modo Escuro'} />
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleMenuClose();
              navigate('/configuracoes');
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <SettingsOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Configurações" />
          </MenuItem>
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon sx={{ minWidth: 32, color: 'error.main' }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Sair da conta" />
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );

  // Desktop: Fixed sidebar
  if (!isMobile) {
    return (
      <Box
        component="aside"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          backgroundColor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          zIndex: (theme) => theme.zIndex.appBar,
          overflowY: 'auto',
        }}
      >
        {drawerContent}
      </Box>
    );
  }

  // Mobile: Temporary Drawer
  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: 'background.paper',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}

/**
 * Layout principal — AppBar + Sidebar (professor) ou AppBar simples (aluno) + conteúdo.
 *
 * Renderiza o Outlet do React Router na área de conteúdo.
 */

import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  useMediaQuery,
  useTheme,
  Button,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import TerminalIcon from '@mui/icons-material/Terminal';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

import { useAuth } from '../../features/auth/hooks/useAuthProvider';
import { useThemeMode } from '../theme/ThemeContext';
import Sidebar from './Sidebar';

export const MENU_PROFESSOR = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'Atividades', icon: <AssignmentIcon />, path: '/atividades' },
];

export const MENU_ALUNO = [
  { label: 'Atividades', icon: <AssignmentIcon />, path: '/aluno/atividades' },
  { label: 'Playground', icon: <TerminalIcon />, path: '/aluno/sandbox' },
];

export default function Layout() {
  const { user, isProfessor, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const { mode, toggleColorMode } = useThemeMode();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  const showNav = true;
  const menuItems = isProfessor ? MENU_PROFESSOR : MENU_ALUNO;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {/* Hamburger no mobile */}
          {showNav && isMobile && (
            <IconButton
              edge="start"
              onClick={() => setSidebarOpen(true)}
              sx={{ color: 'text.primary' }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo */}
          <TerminalIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              letterSpacing: '-0.02em',
              mr: { xs: 1, md: 4 },
            }}
          >
            CodeLab
          </Typography>

          {/* Desktop Navigation */}
          {showNav && !isMobile && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path ||
                  (item.path !== '/' && item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                return (
                  <Button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    startIcon={item.icon}
                    disableRipple
                    sx={{
                      color: isActive ? 'primary.main' : 'text.secondary',
                      backgroundColor: isActive ? 'rgba(21, 101, 192, 0.08)' : 'transparent',
                      fontWeight: isActive ? 600 : 500,
                      px: 2,
                      py: 0.75,
                      borderRadius: 2,
                      '&:hover': {
                        backgroundColor: isActive ? 'rgba(21, 101, 192, 0.12)' : 'action.hover',
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>
          )}

          <Box sx={{ flex: 1 }} />

          <Tooltip title={mode === 'dark' ? 'Modo Claro' : 'Modo Escuro'}>
            <IconButton onClick={toggleColorMode} color="inherit" sx={{ mr: 1, color: 'text.secondary' }}>
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          {/* User info */}
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip
                icon={isProfessor ? <SchoolIcon /> : <PersonIcon />}
                label={isProfessor ? 'Professor' : 'Aluno'}
                size="small"
                color={isProfessor ? 'primary' : 'secondary'}
                variant="outlined"
              />
              <Typography
                variant="body2"
                sx={{ fontWeight: 500, display: { xs: 'none', sm: 'block' } }}
              >
                {user.nome}
              </Typography>
              <IconButton onClick={handleMenuOpen} size="small">
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: isProfessor ? 'primary.main' : 'secondary.main',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  {user.nome?.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: { minWidth: 180, mt: 1 },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem disabled>
                  <ListItemText
                    primary={user.nome}
                    secondary={user.email}
                    slotProps={{
                      primary: { sx: { fontWeight: 600, fontSize: '0.875rem' } },
                      secondary: { sx: { fontSize: '0.75rem' } },
                    }}
                  />
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Sair" />
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Sidebar (Mobile Only) */}
      {showNav && isMobile && (
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: 0,
          mt: '64px', // Toolbar height
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: 'background.default',
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

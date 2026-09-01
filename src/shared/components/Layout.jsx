/**
 * Layout principal — Sidebar lateral (CodeGrade) + Conteúdo.
 *
 * Remove o header superior antigo no desktop, transferindo toda a navegação
 * e identidade para a sidebar esquerda, alinhando com o mockup de tela.
 */

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Sidebar, { DRAWER_WIDTH } from './Sidebar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Sidebar (fixa no Desktop e Drawer no Mobile) */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Barra de topo SOMENTE no Mobile para abrir o menu */}
      {isMobile && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            zIndex: (theme) => theme.zIndex.drawer - 1,
            backgroundColor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            color: 'text.primary',
          }}
        >
          <Toolbar sx={{ minHeight: 56, px: 2, justifyContent: 'space-between' }}>
            <IconButton
              edge="start"
              onClick={() => setSidebarOpen(true)}
              sx={{ color: 'text.primary' }}
              aria-label="abrir menu"
            >
              <MenuIcon />
            </IconButton>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  color: '#4F46E5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.15rem',
                  fontFamily: 'monospace',
                  letterSpacing: '-1px',
                }}
              >
                &lt;/&gt;
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                CodeGrade
              </Typography>
            </Box>

            <Box sx={{ width: 40 }} />
          </Toolbar>
        </AppBar>
      )}

      {/* Área de Conteúdo Principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { xs: 0, md: `${DRAWER_WIDTH}px` },
          mt: { xs: '56px', md: 0 },
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1440, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

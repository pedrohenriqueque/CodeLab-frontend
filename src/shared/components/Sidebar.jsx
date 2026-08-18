/**
 * Sidebar — menu lateral do professor.
 *
 * Drawer permanente (desktop) / temporário (mobile) com links de navegação.
 */

import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Divider,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import { MENU_PROFESSOR, MENU_ALUNO } from './Layout';
import { useAuth } from '../../features/auth/hooks/useAuthProvider';

export const DRAWER_WIDTH = 250;

export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isProfessor } = useAuth();
  const menuItems = isProfessor ? MENU_PROFESSOR : MENU_ALUNO;

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar />
      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'text.secondary',
          }}
        >
          Menu
        </Typography>
      </Box>
      <List sx={{ px: 1, flex: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && item.path !== '/dashboard' && location.pathname.startsWith(item.path));

          return (
            <ListItemButton
              key={item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) onClose?.();
              }}
              selected={isActive}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                py: 1,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: '#fff',
                  '& .MuiListItemIcon-root': { color: '#fff' },
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: isActive ? '#fff' : 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: { sx: { fontSize: '0.875rem', fontWeight: isActive ? 600 : 500 } },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">
          CodeLab v1.0
        </Typography>
      </Box>
    </Box>
  );

  if (!isMobile) {
    return null;
  }

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
    >
      {drawerContent}
    </Drawer>
  );
}

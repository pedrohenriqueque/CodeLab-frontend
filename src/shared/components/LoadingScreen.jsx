/**
 * Tela de carregamento fullscreen.
 */

import { Box, CircularProgress, Typography } from '@mui/material';

export default function LoadingScreen({ message = 'Carregando...' }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      <CircularProgress size={48} thickness={3} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}

/**
 * Context + Provider para feedback global via Snackbar.
 *
 * Uso:
 *   const { showSuccess, showError, showInfo } = useSnackbar();
 *   showSuccess('Atividade criada com sucesso!');
 */

import { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, Slide } from '@mui/material';

const SnackbarContext = createContext(null);

function SlideTransition(props) {
  return <Slide {...props} direction="up" />;
}

export function SnackbarProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    message: '',
    severity: 'info', // 'success' | 'error' | 'warning' | 'info'
  });

  const show = useCallback((message, severity = 'info') => {
    setState({ open: true, message, severity });
  }, []);

  const showSuccess = useCallback((msg) => show(msg, 'success'), [show]);
  const showError = useCallback((msg) => show(msg, 'error'), [show]);
  const showInfo = useCallback((msg) => show(msg, 'info'), [show]);
  const showWarning = useCallback((msg) => show(msg, 'warning'), [show]);

  const handleClose = useCallback((_, reason) => {
    if (reason === 'clickaway') return;
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSuccess, showError, showInfo, showWarning }}>
      {children}
      <Snackbar
        open={state.open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={SlideTransition}
      >
        <Alert
          onClose={handleClose}
          severity={state.severity}
          variant="filled"
          elevation={4}
          sx={{ width: '100%', fontWeight: 500, borderRadius: 2 }}
        >
          {state.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error('useSnackbar deve ser usado dentro de SnackbarProvider');
  return ctx;
}

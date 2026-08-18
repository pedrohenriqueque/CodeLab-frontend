/**
 * Tema MUI centralizado — CodeLab.
 *
 * Paleta clara profissional com acentos em azul.
 * Tipografia: Inter.
 */

import { createTheme, alpha } from '@mui/material/styles';

const PRIMARY = '#1565C0';   // Azul profundo, confiável
const SECONDARY = '#00897B'; // Teal, complementar
const SUCCESS = '#2E7D32';
const WARNING = '#ED6C02';
const ERROR = '#D32F2F';
const INFO = '#0288D1';

const getTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: PRIMARY,
      light: '#42A5F5',
      dark: '#0D47A1',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: SECONDARY,
      light: '#4DB6AC',
      dark: '#00695C',
      contrastText: '#FFFFFF',
    },
    success: { main: SUCCESS },
    warning: { main: WARNING },
    error: { main: ERROR },
    info: { main: INFO },
    background: {
      default: mode === 'light' ? '#F5F7FA' : '#0B0F19',
      paper: mode === 'light' ? '#FFFFFF' : '#111827',
    },
    text: {
      primary: mode === 'light' ? '#1A2138' : '#F9FAFB',
      secondary: mode === 'light' ? '#5E6C84' : '#9CA3AF',
    },
    divider: mode === 'light' ? '#E4E7EC' : '#374151',
    action: {
      hover: alpha(PRIMARY, mode === 'light' ? 0.06 : 0.15),
      selected: alpha(PRIMARY, mode === 'light' ? 0.10 : 0.25),
    },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h4: { fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, fontSize: '1.4rem', letterSpacing: '-0.01em' },
    h6: { fontWeight: 600, fontSize: '1.15rem' },
    subtitle1: { fontWeight: 500, fontSize: '1rem', color: mode === 'light' ? '#5E6C84' : '#9CA3AF' },
    subtitle2: { fontWeight: 500, fontSize: '0.875rem', color: mode === 'light' ? '#5E6C84' : '#9CA3AF' },
    body1: { fontSize: '0.938rem', lineHeight: 1.6 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
    caption: { fontSize: '0.75rem', color: mode === 'light' ? '#8993A4' : '#9CA3AF' },
  },
  shape: { borderRadius: 10 },
  shadows: [
    'none',
    '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
    '0 2px 6px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.08)',
    '0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
    '0 6px 16px rgba(0,0,0,0.08), 0 3px 6px rgba(0,0,0,0.05)',
    '0 8px 24px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)',
    ...Array(19).fill('0 10px 30px rgba(0,0,0,0.10), 0 5px 10px rgba(0,0,0,0.06)'),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: mode === 'light' ? '#F5F7FA' : '#0B0F19' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, padding: '8px 20px', fontSize: '0.875rem', transition: 'all 0.2s ease' },
        contained: { '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(21,101,192,0.3)' } },
        outlined: { borderWidth: '1.5px', '&:hover': { borderWidth: '1.5px', backgroundColor: alpha(PRIMARY, mode === 'light' ? 0.04 : 0.1) } },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${mode === 'light' ? '#E4E7EC' : '#374151'}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
          transition: 'all 0.2s ease',
          backgroundImage: 'none',
          '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)' },
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'all 0.2s ease',
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: PRIMARY },
          },
        },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 500, borderRadius: 6, fontSize: '0.75rem' } } },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
            fontSize: '0.8125rem',
            color: mode === 'light' ? '#5E6C84' : '#9CA3AF',
            backgroundColor: mode === 'light' ? '#F8F9FB' : '#1F2937',
            borderBottom: `2px solid ${mode === 'light' ? '#E4E7EC' : '#374151'}`,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { transition: 'background-color 0.15s ease', '&:hover': { backgroundColor: alpha(PRIMARY, 0.03) } },
      },
    },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 14, backgroundImage: 'none' } } },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid ${mode === 'light' ? '#E4E7EC' : '#374151'}`,
          backgroundColor: mode === 'light' ? '#FAFBFC' : '#111827',
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light' ? '#FFFFFF' : '#111827',
          color: mode === 'light' ? '#1A2138' : '#F9FAFB',
          borderBottom: `1px solid ${mode === 'light' ? '#E4E7EC' : '#374151'}`,
          backgroundImage: 'none',
        },
      },
    },
    MuiFab: { styleOverrides: { root: { borderRadius: 12, textTransform: 'none', fontWeight: 600 } } },
    MuiLinearProgress: { styleOverrides: { root: { borderRadius: 4, height: 6 } } },
  },
});

export default getTheme;

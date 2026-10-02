import { createContext, useMemo, useEffect, useContext } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import getTheme from './theme';

const ThemeModeContext = createContext({
  mode: 'light',
  toggleColorMode: () => {},
});

export const useThemeMode = () => useContext(ThemeModeContext);

export function CustomThemeProvider({ children }) {
  // Limpa qualquer preferência anterior de modo escuro gravada no navegador
  useEffect(() => {
    try {
      localStorage.removeItem('themeMode');
    } catch {
      // Ignora erro de acesso ao localStorage se restrito
    }
  }, []);

  const colorMode = useMemo(
    () => ({
      mode: 'light',
      toggleColorMode: () => {},
    }),
    []
  );

  const theme = useMemo(() => getTheme('light'), []);

  return (
    <ThemeModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

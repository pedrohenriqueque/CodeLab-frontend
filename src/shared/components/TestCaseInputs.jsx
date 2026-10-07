import { Box, Typography } from '@mui/material';
import { describeTestCaseInputs, formatTestCaseValue } from './testCaseValues';

export default function TestCaseInputs({ entradas, parametros }) {
  const { rows, error } = describeTestCaseInputs(entradas, parametros);
  if (error) {
    return <Box sx={{ minWidth: 0 }}>
      <Typography component="div" variant="caption" color="warning.main">{error}</Typography>
      <Box sx={{ fontFamily: 'monospace', overflowWrap: 'anywhere' }}>{formatTestCaseValue(entradas)}</Box>
    </Box>;
  }
  if (!rows.length) return <Typography component="span" variant="caption" color="text.secondary">Sem parâmetros</Typography>;

  return <Box component="dl" sx={{ m: 0, display: 'flex', flexDirection: 'column', gap: 0.35, minWidth: 0 }}>
    {rows.map(({ nome, tipo, valor }) => <Box key={nome} sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 0.75, minWidth: 0 }}>
      <Box component="dt" title={tipo} sx={{ color: 'text.secondary', fontWeight: 600, fontFamily: 'monospace', overflowWrap: 'anywhere' }}>{nome}:</Box>
      <Box component="dd" sx={{ m: 0, fontFamily: 'monospace', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap', minWidth: 0 }}>{formatTestCaseValue(valor)}</Box>
    </Box>)}
  </Box>;
}

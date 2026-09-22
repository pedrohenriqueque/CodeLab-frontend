import { Box, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

const TOKEN_PATTERN = /\/\/.*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:auto|bool|break|case|char|const|continue|default|do|double|else|enum|float|for|if|int|long|return|short|signed|sizeof|static|struct|switch|typedef|unsigned|void|while)\b|\b\d+(?:\.\d+)?\b/g;

function tokenColor(token) {
  if (token.startsWith('//')) return '#64748B';
  if (token.startsWith('"') || token.startsWith("'")) return '#047857';
  if (/^\d/.test(token)) return '#C2410C';
  return '#4338CA';
}

function highlightLine(line) {
  const segments = [];
  let lastIndex = 0;
  for (const match of line.matchAll(TOKEN_PATTERN)) {
    if (match.index > lastIndex) segments.push(line.slice(lastIndex, match.index));
    segments.push(<Box component="span" key={match.index} sx={{ color: tokenColor(match[0]), fontWeight: 600 }}>{match[0]}</Box>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < line.length) segments.push(line.slice(lastIndex));
  return segments;
}

export default function ReadOnlyCodeViewer({ code, fullScreen = false }) {
  const lines = (code || '// Código indisponível').split('\n');

  return <Box sx={{ px: 1.5, py: 1.25, bgcolor: '#F8FAFF', height: fullScreen ? '100%' : { xs: 360, md: 420 }, overflow: 'hidden' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, color: '#64748B', fontSize: '0.68rem', mb: 0.9 }}>
      <LockOutlinedIcon sx={{ fontSize: 13 }} /> Somente leitura
    </Box>
    <Box role="region" aria-label="Código C enviado, somente leitura" tabIndex={0} sx={{ height: 'calc(100% - 24px)', overflow: 'auto', border: '1px solid #DDE6F4', borderRadius: 1.5, bgcolor: '#fff', fontFamily: 'Consolas, Monaco, monospace', fontSize: '0.76rem', lineHeight: 1.6 }}>
      <Box component="code" sx={{ display: 'block', minWidth: 'max-content', py: 0.75 }}>
        {lines.map((line, index) => <Box key={index} sx={{ display: 'flex', minHeight: '1.6em' }}>
          <Typography component="span" aria-hidden="true" sx={{ width: 42, flexShrink: 0, pr: 1.25, textAlign: 'right', color: '#94A3B8', bgcolor: '#F5F8FD', borderRight: '1px solid #E8EEF8', font: 'inherit', userSelect: 'none' }}>{index + 1}</Typography>
          <Box component="span" sx={{ pl: 1.5, pr: 2, whiteSpace: 'pre', color: '#18243D' }}>{highlightLine(line) || ' '}</Box>
        </Box>)}
      </Box>
    </Box>
  </Box>;
}

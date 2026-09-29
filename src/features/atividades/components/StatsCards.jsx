import { Box, Card, Typography, alpha, useTheme } from '@mui/material';

// Ícone 1: Prancheta / Clipboard (Azul)
function ClipboardIcon({ size = 24, color = 'currentColor', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="15" y2="16" />
    </svg>
  );
}

// Ícone 2: Aviãozinho / Envio (Verde)
function PaperPlaneIcon({ size = 24, color = 'currentColor', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

// Ícone 3: Documento / Rascunho (Laranja)
function DocumentDraftIcon({ size = 24, color = 'currentColor', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

export default function StatsCards({ atividades = [] }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const total = atividades.length;
  const publicadas = atividades.filter((a) => a.status === 'PUBLICADA').length;
  const rascunhos = atividades.filter((a) => a.status === 'RASCUNHO').length;

  const cards = [
    {
      label: 'Atividades',
      value: total,
      icon: <ClipboardIcon size={24} color="#2563EB" />,
      color: '#2563EB',
      bg: isDark ? alpha('#2563EB', 0.16) : '#EFF6FF',
    },
    {
      label: 'Publicadas',
      value: publicadas,
      icon: <PaperPlaneIcon size={24} color="#10B981" />,
      color: '#10B981',
      bg: isDark ? alpha('#10B981', 0.16) : '#ECFDF5',
    },
    {
      label: 'Rascunhos',
      value: rascunhos,
      icon: <DocumentDraftIcon size={24} color="#F97316" />,
      color: '#F97316',
      bg: isDark ? alpha('#F97316', 0.16) : '#FFF7ED',
    },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
        gap: 2.5,
        mb: 3,
      }}
    >
      {cards.map((card) => (
        <Card
          key={card.label}
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderRadius: 3.5,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 'none',
            bgcolor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            gap: 2.25,
            transition: 'all 0.15s ease',
          }}
        >
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              bgcolor: card.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {card.icon}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: 'text.primary',
                fontSize: { xs: '1.6rem', sm: '1.85rem' },
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
              }}
            >
              {card.value}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: 'text.secondary',
                fontSize: '0.85rem',
                mt: 0.35,
                lineHeight: 1.2,
              }}
            >
              {card.label}
            </Typography>
          </Box>
        </Card>
      ))}
    </Box>
  );
}

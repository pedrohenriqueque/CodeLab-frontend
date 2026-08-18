/**
 * StatsCards — cards de resumo no topo do dashboard do professor.
 *
 * Props: atividades (array) — para calcular stats.
 */

import { Box, Card, CardContent, Typography } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PublishIcon from '@mui/icons-material/Publish';
import DraftsIcon from '@mui/icons-material/Drafts';

export default function StatsCards({ atividades = [] }) {
  const ativas = atividades.filter((a) => a.status === 'publicado').length;
  const rascunhos = atividades.filter((a) => a.status === 'rascunho').length;
  const total = atividades.length;

  const cards = [
    {
      label: 'Total de Atividades',
      value: total,
      icon: <AssignmentIcon />,
      color: '#1565C0',
      bg: '#E3F2FD',
    },
    {
      label: 'Atividades Publicadas',
      value: ativas,
      icon: <PublishIcon />,
      color: '#2E7D32',
      bg: '#E8F5E9',
    },
    {
      label: 'Em Rascunho',
      value: rascunhos,
      icon: <DraftsIcon />,
      color: '#ED6C02',
      bg: '#FFF3E0',
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
        <Card key={card.label} sx={{ border: 'none', position: 'relative', overflow: 'visible' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2.5 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: card.bg,
                color: card.color,
                flexShrink: 0,
              }}
            >
              {card.icon}
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: card.color, lineHeight: 1 }}>
                {card.value}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                {card.label}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

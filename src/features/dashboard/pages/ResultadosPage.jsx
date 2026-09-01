import React from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  LinearProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';

const ATIVIDADES_DESEMPENHO = [
  { titulo: 'Trabalho 02 - Funções', entregues: 22, total: 32, media: 7.2, aprovacao: 82 },
  { titulo: 'Trabalho 01 - Vetores', entregues: 27, total: 32, media: 8.5, aprovacao: 90 },
  { titulo: 'Lista 03 - Estruturas', entregues: 19, total: 32, media: 6.8, aprovacao: 74 },
  { titulo: 'Exercícios - Condicionais', entregues: 32, total: 32, media: 9.1, aprovacao: 97 },
];

export default function ResultadosPage() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
          Resultados & Desempenho
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Relatórios consolidado de aproveitamento e avaliações da turma
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SchoolIcon />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>6.8</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Média Geral</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircleIcon />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>85.7%</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Taxa de Aprovação</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: '#EFF6FF', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AssignmentTurnedInIcon />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>153</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Submissões Avaliadas</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: '#F5F3FF', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShowChartIcon />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>+12%</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Evolução Semanal</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Detail Breakdown */}
      <Card sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Aproveitamento por Atividade
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {ATIVIDADES_DESEMPENHO.map((atv, idx) => (
            <Box key={idx} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{atv.titulo}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {atv.entregues} de {atv.total} alunos submeteram
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#4F46E5' }}>
                    Média {atv.media.toFixed(1)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {atv.aprovacao}% aprovados
                  </Typography>
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={atv.aprovacao}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: atv.aprovacao >= 80 ? '#10B981' : '#F59E0B',
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
          ))}
        </Box>
      </Card>
    </Box>
  );
}

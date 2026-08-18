import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper, Grid } from '@mui/material';
import { dashboardApi } from '../api';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await dashboardApi.getEstatisticas();
        setStats(data);
      } catch (err) {
        setError('Erro ao carregar estatísticas do dashboard.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return <Box sx={{ p: 4 }}>Carregando dashboard...</Box>;
  if (error) return <Box sx={{ p: 4, color: 'error.main' }}>{error}</Box>;
  if (!stats) return null;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>Painel do Professor</Typography>
        <Typography variant="body1" color="text.secondary">
          Acompanhe o engajamento e o desempenho dos alunos.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', mb: 1 }}>
                Alunos Ativos
              </Typography>
              <Typography variant="h3" color="primary.main" sx={{ fontWeight: 700 }}>
                {stats.total_alunos_ativos}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', mb: 1 }}>
                Total de Submissões
              </Typography>
              <Typography variant="h3" color="primary.main" sx={{ fontWeight: 700 }}>
                {stats.total_submissoes}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', mb: 1 }}>
                Taxa de Acerto (Média)
              </Typography>
              <Typography variant="h3" color="primary.main" sx={{ fontWeight: 700 }}>
                {stats.taxa_aprovacao_media.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">Engajamento por Atividade</Typography>
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Atividade</TableCell>
              <TableCell>Qtd. Funções</TableCell>
              <TableCell>Submissões Totais</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stats.atividades_engajamento.map(atv => (
              <TableRow key={atv.atividade_uuid} hover>
                <TableCell>{atv.titulo}</TableCell>
                <TableCell>{atv.total_funcoes}</TableCell>
                <TableCell>
                  <strong>{atv.total_submissoes}</strong>
                </TableCell>
              </TableRow>
            ))}
            {stats.atividades_engajamento.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  Nenhuma atividade encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

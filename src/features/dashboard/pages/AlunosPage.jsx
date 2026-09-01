import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  Grid,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const MOCK_ALUNOS = [
  { id: 1, nome: 'Ana Beatriz Souza', email: 'ana.souza@universidade.edu.br', matricula: '20240101', concluidas: 8, total: 8, media: 9.2, status: 'Excelente' },
  { id: 2, nome: 'Carlos Eduardo Lima', email: 'carlos.lima@universidade.edu.br', matricula: '20240102', concluidas: 7, total: 8, media: 7.8, status: 'Ativo' },
  { id: 3, nome: 'Diego Santos Pereira', email: 'diego.santos@universidade.edu.br', matricula: '20240103', concluidas: 6, total: 8, media: 6.5, status: 'Ativo' },
  { id: 4, nome: 'Fernanda Oliveira Rocha', email: 'fernanda.rocha@universidade.edu.br', matricula: '20240104', concluidas: 8, total: 8, media: 8.9, status: 'Excelente' },
  { id: 5, nome: 'Gabriel Martins Costa', email: 'gabriel.costa@universidade.edu.br', matricula: '20240105', concluidas: 5, total: 8, media: 5.4, status: 'Atenção' },
  { id: 6, nome: 'Isabela Ferreira Ramos', email: 'isabela.ramos@universidade.edu.br', matricula: '20240106', concluidas: 7, total: 8, media: 8.1, status: 'Ativo' },
  { id: 7, nome: 'Lucas Silva Mendes', email: 'lucas.mendes@universidade.edu.br', matricula: '20240107', concluidas: 8, total: 8, media: 9.5, status: 'Excelente' },
  { id: 8, nome: 'Mariana Castro Dias', email: 'mariana.dias@universidade.edu.br', matricula: '20240108', concluidas: 4, total: 8, media: 4.8, status: 'Atenção' },
];

function getInitials(name) {
  const parts = name.split(' ');
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

export default function AlunosPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = MOCK_ALUNOS.filter(
    (a) =>
      a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.matricula.includes(searchTerm)
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
          Alunos
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Acompanhamento e desempenho dos estudantes matriculados
        </Typography>
      </Box>

      {/* Metric Cards */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PeopleAltOutlinedIcon />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>32</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Total de Alunos</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircleIcon />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>91.4%</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Taxa de Entrega</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: '#FEF3C7', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUpIcon />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>7.4</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Média das Notas</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Table Card */}
      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Lista da Turma (CC - Algoritmos I)
          </Typography>
          <TextField
            size="small"
            placeholder="Buscar por aluno, email ou matrícula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 280 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ fontWeight: 600 }}>Aluno</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Matrícula</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Atividades Entregues</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Média</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Situação</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((aluno) => (
                <TableRow key={aluno.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 34, height: 34, bgcolor: '#4F46E5', fontSize: '0.8rem', fontWeight: 600 }}>
                        {getInitials(aluno.nome)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{aluno.nome}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{aluno.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                      {aluno.matricula}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {aluno.concluidas} / {aluno.total}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: aluno.media >= 7 ? '#10B981' : (aluno.media >= 5 ? '#F59E0B' : '#EF4444') }}>
                      {aluno.media.toFixed(1)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={aluno.status}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        bgcolor: aluno.status === 'Excelente' ? '#ECFDF5' : (aluno.status === 'Ativo' ? '#EEF2FF' : '#FEF2F2'),
                        color: aluno.status === 'Excelente' ? '#059669' : (aluno.status === 'Ativo' ? '#4F46E5' : '#DC2626'),
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}

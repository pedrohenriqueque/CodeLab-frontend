import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Avatar, Box, Button, Card, Dialog, DialogActions, DialogContent,
  DialogTitle, IconButton, InputAdornment, Skeleton, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography, Grid,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import { getAlunosTurma, removerAlunoTurma } from '../../turmas/api';
import { useTurmaContext } from '../../turmas/context/TurmaContext';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';

function getInitials(nome) {
  const partes = nome.trim().split(/\s+/);
  return partes.length > 1
    ? `${partes[0][0]}${partes.at(-1)[0]}`.toUpperCase()
    : nome.slice(0, 2).toUpperCase();
}

export default function AlunosPage() {
  const { turmaAtiva } = useTurmaContext();
  const { showSuccess, showError } = useSnackbar();
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [alunoParaRemover, setAlunoParaRemover] = useState(null);
  const [removendo, setRemovendo] = useState(false);

  useEffect(() => {
    let ativo = true;
    async function carregarAlunos() {
      if (!turmaAtiva?.uuid) {
        if (ativo) {
          setAlunos([]);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const dados = await getAlunosTurma(turmaAtiva.uuid);
        if (ativo) setAlunos(Array.isArray(dados) ? dados : []);
      } catch (requestError) {
        if (ativo) {
          setAlunos([]);
          setError(requestError.response?.data?.erro || 'Não foi possível carregar os alunos da turma.');
        }
      } finally {
        if (ativo) setLoading(false);
      }
    }
    carregarAlunos();
    return () => { ativo = false; };
  }, [turmaAtiva]);

  const alunosFiltrados = useMemo(() => {
    const termo = searchTerm.trim().toLocaleLowerCase('pt-BR');
    if (!termo) return alunos;
    return alunos.filter((aluno) => (
      aluno.nome.toLocaleLowerCase('pt-BR').includes(termo) ||
      aluno.matricula.toLocaleLowerCase('pt-BR').includes(termo)
    ));
  }, [alunos, searchTerm]);
  const medias = alunos.map((aluno) => aluno.mediaNota).filter((nota) => nota != null);
  const mediaTurma = medias.length ? medias.reduce((total, nota) => total + Number(nota), 0) / medias.length : null;
  const entregas = alunos.reduce((total, aluno) => total + aluno.atividadesEnviadas, 0);
  const atividades = alunos.reduce((total, aluno) => total + aluno.totalAtividades, 0);

  const confirmarRemocao = async () => {
    if (!turmaAtiva?.uuid || !alunoParaRemover) return;
    setRemovendo(true);
    try {
      await removerAlunoTurma(turmaAtiva.uuid, alunoParaRemover.uuid);
      setAlunos((atuais) => atuais.filter((aluno) => aluno.uuid !== alunoParaRemover.uuid));
      showSuccess('Aluno removido da turma.');
      setAlunoParaRemover(null);
    } catch (requestError) {
      showError(requestError.response?.data?.erro || 'Não foi possível remover o aluno da turma.');
    } finally {
      setRemovendo(false);
    }
  };

  if (!turmaAtiva) {
    return <Alert severity="info">Selecione uma turma para consultar os alunos matriculados.</Alert>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>Alunos</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>Alunos matriculados em {turmaAtiva.nome}.</Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PeopleAltOutlinedIcon /></Box>
              <Box><Typography variant="h5" sx={{ fontWeight: 800 }}>{alunos.length}</Typography><Typography variant="caption" sx={{ color: 'text.secondary' }}>Total de alunos</Typography></Box>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircleIcon /></Box>
              <Box><Typography variant="h5" sx={{ fontWeight: 800 }}>{atividades ? `${Math.round((entregas / atividades) * 100)}%` : '—'}</Typography><Typography variant="caption" sx={{ color: 'text.secondary' }}>Taxa de entrega</Typography></Box>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: '#FEF3C7', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingUpIcon /></Box>
              <Box><Typography variant="h5" sx={{ fontWeight: 800 }}>{mediaTurma == null ? '—' : mediaTurma.toFixed(1)}</Typography><Typography variant="caption" sx={{ color: 'text.secondary' }}>Média das notas</Typography></Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Lista da turma</Typography>
          <TextField
            size="small"
            placeholder="Buscar por aluno ou matrícula..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            sx={{ minWidth: 280 }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment> } }}
          />
        </Box>

        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ p: 2.5 }}>{[1, 2, 3].map((item) => <Skeleton key={item} variant="rounded" height={48} sx={{ mb: 1 }} />)}</Box>
        ) : alunosFiltrados.length === 0 ? (
          <Alert severity="info" sx={{ m: 2.5 }}>{alunos.length === 0 ? 'Nenhum aluno está matriculado nesta turma.' : 'Nenhum aluno encontrado.'}</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead><TableRow sx={{ bgcolor: 'background.default' }}><TableCell sx={{ fontWeight: 600 }}>Aluno</TableCell><TableCell sx={{ fontWeight: 600 }}>Matrícula</TableCell><TableCell sx={{ fontWeight: 600 }}>Atividades enviadas</TableCell><TableCell sx={{ fontWeight: 600 }}>Média</TableCell><TableCell sx={{ fontWeight: 600 }}>Situação</TableCell><TableCell align="right" sx={{ fontWeight: 600 }}>Ações</TableCell></TableRow></TableHead>
              <TableBody>
                {alunosFiltrados.map((aluno) => (
                  <TableRow key={aluno.uuid} hover>
                    <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><Avatar sx={{ width: 34, height: 34, bgcolor: '#4F46E5', fontSize: '0.8rem', fontWeight: 600 }}>{getInitials(aluno.nome)}</Avatar><Box><Typography variant="body2" sx={{ fontWeight: 600 }}>{aluno.nome}</Typography><Typography variant="caption" color="text.secondary">{aluno.email}</Typography></Box></Box></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{aluno.matricula}</Typography></TableCell>
                    <TableCell>{aluno.atividadesEnviadas} / {aluno.totalAtividades}</TableCell>
                    <TableCell>{aluno.mediaNota == null ? '—' : Number(aluno.mediaNota).toFixed(1)}</TableCell>
                    <TableCell><Typography variant="body2">{aluno.situacao}</Typography></TableCell>
                    <TableCell align="right"><Tooltip title="Remover da turma"><IconButton color="error" onClick={() => setAlunoParaRemover(aluno)} aria-label={`Remover ${aluno.nome} da turma`}><PersonRemoveOutlinedIcon /></IconButton></Tooltip></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog open={Boolean(alunoParaRemover)} onClose={() => !removendo && setAlunoParaRemover(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remover aluno da turma?</DialogTitle>
        <DialogContent><Typography>{alunoParaRemover ? `Remover ${alunoParaRemover.nome} desta turma?` : ''}</Typography></DialogContent>
        <DialogActions><Button onClick={() => setAlunoParaRemover(null)} disabled={removendo}>Cancelar</Button><Button color="error" variant="contained" onClick={confirmarRemocao} disabled={removendo}>{removendo ? 'Removendo...' : 'Remover'}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

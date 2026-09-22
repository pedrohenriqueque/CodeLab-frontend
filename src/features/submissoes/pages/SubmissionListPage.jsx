import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Avatar, Box, Button, Card, Chip, FormControl, InputAdornment, MenuItem, Pagination, Select, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { getSubmissoes } from '../api';
import { getAtividadesResumo } from '../../atividades/api';
import { useTurmaContext } from '../../turmas/context/TurmaContext';
import { FILTERABLE_STATUSES, formatScore, formatSubmissionDate, statusInfo } from '../components/submissionDisplay';

const PAGE_SIZE = 8;
const initials = (name) => name?.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';

export default function SubmissionListPage() {
  const { uuid: atividadeUuid, funcaoUuid } = useParams();
  const { turmaAtiva } = useTurmaContext();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [classActivities, setClassActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activity, setActivity] = useState(atividadeUuid || 'all');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    if (!turmaAtiva?.uuid) return undefined;
    Promise.all([getSubmissoes(), getAtividadesResumo(turmaAtiva.uuid)]).then(([items, activities]) => {
      if (active) { setSubmissions(items); setClassActivities(activities); setError(''); setLoading(false); }
    }).catch((err) => {
      if (active) { setError(err.response?.data?.erro || 'Não foi possível carregar as submissões.'); setLoading(false); }
    });
    return () => { active = false; };
  }, [reload, turmaAtiva?.uuid]);

  const turmaSubmissions = useMemo(() => {
    const activityIds = new Set(classActivities.map((item) => item.uuid));
    return submissions.filter((item) => activityIds.has(item.atividadeUuid) && (!funcaoUuid || item.funcaoUuid === funcaoUuid));
  }, [submissions, classActivities, funcaoUuid]);
  const activities = useMemo(() => classActivities.map((item) => [item.uuid, item.titulo]), [classActivities]);
  const filtered = useMemo(() => turmaSubmissions.filter((item) => {
    const matchesActivity = activity === 'all' || item.atividadeUuid === activity;
    const matchesStatus = status === 'all' || item.status === status;
    const text = `${item.alunoNome || ''} ${item.alunoMatricula || ''} ${item.atividadeTitulo || ''} ${item.funcaoNome || ''}`.toLocaleLowerCase('pt-BR');
    return matchesActivity && matchesStatus && text.includes(query.trim().toLocaleLowerCase('pt-BR'));
  }).sort((a, b) => new Date(b.dataSubmissao) - new Date(a.dataSubmissao)), [turmaSubmissions, activity, status, query]);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const setFilter = (setter) => (value) => { setter(value); setPage(1); };

  return <Stack spacing={2.5}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <AssignmentOutlinedIcon color="primary" sx={{ fontSize: 34 }} />
      <Box><Typography component="h1" variant="h4">Submissões</Typography><Typography color="text.secondary">Consulte os códigos enviados e os resultados das correções da turma.</Typography></Box>
    </Box>

    <Card variant="outlined" sx={{ p: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(160px, 1fr) minmax(200px, 1.15fr) minmax(0, 2.4fr)' }, gap: 2, alignItems: 'end' }}>
        <Box><Typography component="label" htmlFor="activity-filter" variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 700 }}>Atividade</Typography>
          <FormControl fullWidth size="small"><Select id="activity-filter" value={activity} onChange={(event) => setFilter(setActivity)(event.target.value)}><MenuItem value="all">Todas as atividades</MenuItem>{activities.map(([id, title]) => <MenuItem key={id} value={id}>{title}</MenuItem>)}</Select></FormControl></Box>
        <Box><Typography component="label" htmlFor="submission-search" variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 700 }}>Buscar</Typography>
          <TextField id="submission-search" fullWidth size="small" value={query} onChange={(event) => setFilter(setQuery)(event.target.value)} placeholder="Aluno, matrícula ou atividade" slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlinedIcon fontSize="small" /></InputAdornment> } }} /></Box>
        <Box><Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 700 }}>Situação</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>{[['all', 'Todas'], ...FILTERABLE_STATUSES.map((key) => [key, statusInfo(key).label])].map(([key, label]) => <Chip key={key} clickable onClick={() => setFilter(setStatus)(key)} label={label} color={status === key ? 'primary' : 'default'} variant={status === key ? 'filled' : 'outlined'} />)}</Box></Box>
      </Box>
    </Card>

    {error && <Alert severity="error" action={<Button onClick={() => { setLoading(true); setReload((n) => n + 1); }}>Tentar novamente</Button>}>{error}</Alert>}
    {loading ? <Stack spacing={1}>{[0, 1, 2, 3].map((n) => <Skeleton key={n} variant="rounded" height={62} />)}</Stack> : !error && <Card variant="outlined" sx={{ overflow: 'hidden' }}>
      <TableContainer><Table sx={{ minWidth: 780 }}><TableHead><TableRow><TableCell>Aluno</TableCell><TableCell>Atividade / Função</TableCell><TableCell>Situação</TableCell><TableCell>Nota</TableCell><TableCell>Enviada em</TableCell><TableCell align="right">Ação</TableCell></TableRow></TableHead>
        <TableBody>{visible.map((item) => <TableRow key={item.uuid} hover>
          <TableCell><Stack direction="row" spacing={1.25} alignItems="center"><Avatar sx={{ width: 34, height: 34, bgcolor: 'action.selected', color: 'primary.main', fontSize: 12, fontWeight: 700 }}>{initials(item.alunoNome)}</Avatar><Box><Typography variant="body2" fontWeight={700}>{item.alunoNome || 'Aluno'}</Typography>{item.alunoMatricula && <Typography variant="caption" color="text.secondary">{item.alunoMatricula}</Typography>}</Box></Stack></TableCell>
          <TableCell><Typography variant="body2" fontWeight={700}>{item.atividadeTitulo}</Typography><Typography variant="caption" color="text.secondary">{item.funcaoNome}()</Typography></TableCell>
          <TableCell><Chip size="small" color={statusInfo(item.status).color} label={statusInfo(item.status).label} /></TableCell>
          <TableCell><Typography variant="body2" fontWeight={700}>{formatScore(item.nota, item.pontosTotal)}</Typography></TableCell>
          <TableCell><Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>{formatSubmissionDate(item.dataSubmissao)}</Typography></TableCell>
          <TableCell align="right"><Button size="small" variant="outlined" startIcon={<VisibilityOutlinedIcon />} onClick={() => navigate(`/submissoes/${item.uuid}`)}>Ver detalhes</Button></TableCell>
        </TableRow>)}
          {!filtered.length && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><Typography color="text.secondary">{turmaSubmissions.length ? 'Nenhuma submissão corresponde aos filtros.' : 'Ainda não há submissões nesta turma.'}</Typography></TableCell></TableRow>}
        </TableBody></Table></TableContainer>
      <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}><Typography variant="caption" color="text.secondary">Mostrando {visible.length} de {filtered.length} submissões</Typography><Pagination page={page} count={Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))} onChange={(_, value) => setPage(value)} size="small" color="primary" /></Box>
    </Card>}
  </Stack>;
}

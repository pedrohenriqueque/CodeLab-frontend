import { Children, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  FormControl,
  InputAdornment,
  MenuItem,
  OutlinedInput,
  Pagination,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import { getSubmissoes } from '../api';
import { getAtividadesResumo } from '../../atividades/api';
import { useTurmaContext } from '../../turmas/context/TurmaContext';
import { formatScore, formatSubmissionDate, statusInfo } from '../components/submissionDisplay';

const PAGE_SIZE = 8;
const initials = (name) => name?.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';
const normalizeFunctionName = (name) => String(name || '').trim().replace(/\(\s*\)$/, '').toLocaleLowerCase('pt-BR');

function getFunctionOptions(submissions, studentId, activityUuid) {
  const uniqueFunctions = new Map();
  submissions.forEach((item) => {
    const itemStudentId = item.alunoMatricula || item.alunoNome;
    if (studentId !== 'all' && itemStudentId !== studentId) return;
    if (activityUuid !== 'all' && item.atividadeUuid !== activityUuid) return;

    const id = normalizeFunctionName(item.funcaoNome);
    if (id && !uniqueFunctions.has(id)) {
      uniqueFunctions.set(id, { id, name: String(item.funcaoNome).trim().replace(/\(\s*\)$/, '') || 'Função' });
    }
  });
  return [...uniqueFunctions.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

function FilterSelect({ id, label, value, onChange, placeholder, icon, children }) {
  return (
    <Box>
      <Typography component="label" htmlFor={id} variant="caption" sx={{ display: 'block', mb: 0.55, fontWeight: 700, color: '#27365F' }}>
        {label}
      </Typography>
      <FormControl fullWidth size="small">
        <Select
          id={id}
          value={value}
          onChange={onChange}
          displayEmpty
          input={(
            <OutlinedInput
              startAdornment={(
                <InputAdornment position="start" sx={{ color: '#6579A6' }}>
                  {icon}
                </InputAdornment>
              )}
            />
          )}
          sx={{
            borderRadius: 1.75,
            bgcolor: '#FFFFFF',
            color: '#34466F',
            '& .MuiSelect-select': { py: 1.05 },
          }}
          renderValue={(selected) => {
            if (selected === 'all') return placeholder;
            const options = Children.toArray(children);
            return options.find((option) => option?.props?.value === selected)?.props?.children || placeholder;
          }}
        >
          {children}
        </Select>
      </FormControl>
    </Box>
  );
}

export default function SubmissionListPage() {
  const { uuid: paramAtividadeUuid, funcaoUuid } = useParams();
  const [searchParams] = useSearchParams();
  const queryAtividadeUuid = searchParams.get('atividade') || searchParams.get('atividadeUuid') || searchParams.get('uuid');
  const targetActivityUuid = paramAtividadeUuid || queryAtividadeUuid || 'all';

  const { turmaAtiva, turmas, setTurmaAtiva } = useTurmaContext();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [classActivities, setClassActivities] = useState([]);
  const [loadedTurmaUuid, setLoadedTurmaUuid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [student, setStudent] = useState('all');
  const [prevTargetActivityUuid, setPrevTargetActivityUuid] = useState(targetActivityUuid);
  const [activity, setActivity] = useState(targetActivityUuid);
  const [funcao, setFuncao] = useState(funcaoUuid || 'all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);

  if (targetActivityUuid !== prevTargetActivityUuid) {
    setPrevTargetActivityUuid(targetActivityUuid);
    setActivity(targetActivityUuid);
    setPage(1);
  }

  // Se a atividade for de outra turma ou turma não selecionada, sincroniza turmaAtiva
  useEffect(() => {
    if (targetActivityUuid && targetActivityUuid !== 'all' && submissions.length > 0 && turmas?.length > 0) {
      const sub = submissions.find((s) => s.atividadeUuid === targetActivityUuid);
      if (sub?.turmaUuid && turmaAtiva?.uuid !== sub.turmaUuid) {
        const foundTurma = turmas.find((t) => t.uuid === sub.turmaUuid);
        if (foundTurma) setTurmaAtiva(foundTurma);
      }
    }
  }, [targetActivityUuid, submissions, turmas, turmaAtiva, setTurmaAtiva]);

  useEffect(() => {
    let active = true;
    if (!turmaAtiva?.uuid) return undefined;

    Promise.all([getSubmissoes(), getAtividadesResumo(turmaAtiva.uuid)]).then(([items, activities]) => {
      if (active) {
        setSubmissions(items);
        setClassActivities(activities);
        setError('');
        setLoadedTurmaUuid(turmaAtiva.uuid);
        setLoading(false);
      }
    }).catch((err) => {
      if (active) {
        setError(err.response?.data?.erro || 'Não foi possível carregar as submissões.');
        setLoadedTurmaUuid(turmaAtiva.uuid);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [reload, turmaAtiva?.uuid]);

  const turmaSubmissions = useMemo(() => {
    const activityIds = new Set(classActivities.map((item) => item.uuid));
    if (activity && activity !== 'all') {
      activityIds.add(activity);
    }
    return submissions.filter((item) => activityIds.has(item.atividadeUuid) && (!funcaoUuid || item.funcaoUuid === funcaoUuid));
  }, [submissions, classActivities, funcaoUuid, activity]);

  const studentOptions = useMemo(() => {
    const uniqueStudents = new Map();
    turmaSubmissions.forEach((item) => {
      const id = item.alunoMatricula || item.alunoNome;
      if (id && !uniqueStudents.has(id)) {
        uniqueStudents.set(id, {
          id,
          name: item.alunoNome || 'Aluno',
          registration: item.alunoMatricula || '',
        });
      }
    });
    return [...uniqueStudents.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [turmaSubmissions]);

  const activityOptions = useMemo(() => {
    const map = new Map();
    classActivities.forEach((item) => {
      map.set(item.uuid, item.titulo);
    });
    if (activity && activity !== 'all' && !map.has(activity)) {
      const sub = submissions.find((item) => item.atividadeUuid === activity);
      map.set(activity, sub?.atividadeTitulo || 'Atividade selecionada');
    }
    return [...map.entries()];
  }, [classActivities, activity, submissions]);

  const selectedStudent = studentOptions.some((item) => item.id === student) ? student : 'all';
  const selectedActivity = activityOptions.some(([id]) => id === activity) ? activity : (activity !== 'all' ? activity : 'all');
  const functionOptions = useMemo(
    () => getFunctionOptions(turmaSubmissions, selectedStudent, selectedActivity),
    [turmaSubmissions, selectedStudent, selectedActivity],
  );
  const selectedFunction = functionOptions.some((item) => item.id === funcao)
    ? funcao
    : funcaoUuid && functionOptions.length === 1 ? functionOptions[0].id : 'all';

  const filtered = useMemo(() => turmaSubmissions.filter((item) => {
    const studentId = item.alunoMatricula || item.alunoNome;
    const matchesStudent = selectedStudent === 'all' || studentId === selectedStudent;
    const matchesActivity = selectedActivity === 'all' || item.atividadeUuid === selectedActivity;
    const matchesFunction = funcaoUuid
      ? item.funcaoUuid === funcaoUuid
      : selectedFunction === 'all' || normalizeFunctionName(item.funcaoNome) === selectedFunction;
    const text = `${item.alunoNome || ''} ${item.alunoMatricula || ''} ${item.atividadeTitulo || ''} ${item.funcaoNome || ''}`.toLocaleLowerCase('pt-BR');
    return matchesStudent && matchesActivity && matchesFunction && text.includes(query.trim().toLocaleLowerCase('pt-BR'));
  }).sort((a, b) => new Date(b.dataSubmissao) - new Date(a.dataSubmissao)), [turmaSubmissions, selectedStudent, selectedActivity, selectedFunction, funcaoUuid, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const selectedPage = Math.min(page, pageCount);
  const visible = filtered.slice((selectedPage - 1) * PAGE_SIZE, selectedPage * PAGE_SIZE);
  const setFilter = (setter) => (value) => { setter(value); setPage(1); };
  const setContextFilter = (filter, setter) => (value) => {
    const nextStudent = filter === 'student' ? value : selectedStudent;
    const nextActivity = filter === 'activity' ? value : selectedActivity;
    const nextFunctions = getFunctionOptions(turmaSubmissions, nextStudent, nextActivity);
    if (funcao !== 'all' && !nextFunctions.some((item) => item.id === funcao)) setFuncao('all');
    setter(value);
    setPage(1);
  };
  const carregandoTurmaAtiva = loading || loadedTurmaUuid !== turmaAtiva?.uuid;
  const erroTurmaAtiva = loadedTurmaUuid === turmaAtiva?.uuid ? error : '';

  if (!turmaAtiva) return <Alert severity="info">Selecione uma turma para consultar as submissões.</Alert>;

  return <Stack spacing={2.5}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <AssignmentOutlinedIcon color="primary" sx={{ fontSize: 34 }} />
      <Box><Typography component="h1" variant="h4">Submissões</Typography><Typography color="text.secondary">Consulte os códigos enviados e os resultados das correções da turma.</Typography></Box>
    </Box>

    <Card variant="outlined" sx={{ p: 2, borderColor: '#E1EAF5', borderRadius: 2.5, boxShadow: '0 3px 14px rgba(40, 76, 132, 0.04)' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 1.75, alignItems: 'end' }}>
        <FilterSelect
          id="student-filter"
          label="Aluno"
          value={selectedStudent}
          onChange={(event) => setContextFilter('student', setStudent)(event.target.value)}
          placeholder="Todos os alunos"
          icon={<PersonOutlineOutlinedIcon fontSize="small" />}
        >
          <MenuItem value="all">Todos os alunos</MenuItem>
          {studentOptions.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}{item.registration ? ` · ${item.registration}` : ''}</MenuItem>)}
        </FilterSelect>

        <FilterSelect
          id="activity-filter"
          label="Atividade"
          value={selectedActivity}
          onChange={(event) => setContextFilter('activity', setActivity)(event.target.value)}
          placeholder="Todas as atividades"
          icon={<ArticleOutlinedIcon fontSize="small" />}
        >
          <MenuItem value="all">Todas as atividades</MenuItem>
          {activityOptions.map(([id, title]) => <MenuItem key={id} value={id}>{title}</MenuItem>)}
        </FilterSelect>

        <FilterSelect
          id="function-filter"
          label="Função"
          value={selectedFunction}
          onChange={(event) => setFilter(setFuncao)(event.target.value)}
          placeholder="Todas as funções"
          icon={<CodeOutlinedIcon fontSize="small" />}
        >
          <MenuItem value="all">Todas as funções</MenuItem>
          {functionOptions.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}()</MenuItem>)}
        </FilterSelect>

        <Box>
          <Typography component="label" htmlFor="submission-search" variant="caption" sx={{ display: 'block', mb: 0.55, fontWeight: 700, color: '#27365F' }}>Buscar</Typography>
          <TextField
            id="submission-search"
            fullWidth
            size="small"
            value={query}
            onChange={(event) => setFilter(setQuery)(event.target.value)}
            placeholder="Buscar por aluno, atividade ou função"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.75, bgcolor: '#FFFFFF' } }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlinedIcon sx={{ color: '#6579A6' }} /></InputAdornment> } }}
          />
        </Box>
      </Box>
    </Card>

    {erroTurmaAtiva && <Alert severity="error" action={<Button onClick={() => { setLoading(true); setReload((n) => n + 1); }}>Tentar novamente</Button>}>{erroTurmaAtiva}</Alert>}
    {carregandoTurmaAtiva ? <Stack spacing={1}>{[0, 1, 2, 3].map((n) => <Skeleton key={n} variant="rounded" height={62} />)}</Stack> : !erroTurmaAtiva && <Card variant="outlined" sx={{ overflow: 'hidden', borderColor: '#E1EAF5', borderRadius: 2.5 }}>
      <Box sx={{ px: 2, py: 1.35, borderBottom: '1px solid', borderColor: '#E6ECF5' }}>
        <Typography variant="body2" color="text.secondary">Mostrando {visible.length} submissões</Typography>
      </Box>
      <TableContainer>
        <Table sx={{ minWidth: 1120 }} aria-label="Submissões da turma">
          <TableHead>
            <TableRow sx={{ bgcolor: '#F6F8FB' }}>
              <TableCell>Aluno</TableCell>
              <TableCell>Atividade</TableCell>
              <TableCell>Função</TableCell>
              <TableCell>Situação</TableCell>
              <TableCell>Nota</TableCell>
              <TableCell>Enviada em</TableCell>
              <TableCell align="right">Ação</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.map((item) => (
              <TableRow key={item.uuid} hover>
                <TableCell>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Avatar sx={{ width: 36, height: 36, bgcolor: '#E8F2FF', color: '#0871F9', fontSize: 12, fontWeight: 700 }}>{initials(item.alunoNome)}</Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{item.alunoNome || 'Aluno'}</Typography>
                      {item.alunoMatricula && <Typography variant="caption" color="text.secondary">{item.alunoMatricula}</Typography>}
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell><Typography variant="body2">{item.atividadeTitulo}</Typography></TableCell>
                <TableCell><Typography variant="body2" color="text.secondary">{item.funcaoNome}()</Typography></TableCell>
                <TableCell><Chip size="small" color={statusInfo(item.status).color} label={statusInfo(item.status).label} /></TableCell>
                <TableCell><Typography variant="body2" fontWeight={600}>{formatScore(item.nota, item.pontosTotal)}</Typography></TableCell>
                <TableCell><Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>{formatSubmissionDate(item.dataSubmissao)}</Typography></TableCell>
                <TableCell align="right"><Button size="small" variant="outlined" startIcon={<VisibilityOutlinedIcon />} onClick={() => navigate(`/submissoes/${item.uuid}`)}>Ver detalhes</Button></TableCell>
              </TableRow>
            ))}
            {!filtered.length && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><Typography color="text.secondary">{turmaSubmissions.length ? 'Nenhuma submissão corresponde aos filtros.' : 'Ainda não há submissões nesta turma.'}</Typography></TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="caption" color="text.secondary">Mostrando {visible.length} de {filtered.length} submissões</Typography>
        <Pagination page={selectedPage} count={pageCount} onChange={(_, value) => setPage(value)} size="small" color="primary" />
      </Box>
    </Card>}
  </Stack>;
}

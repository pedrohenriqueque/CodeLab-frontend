import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, Chip, LinearProgress, Skeleton, Stack, Typography } from '@mui/material';
import { dashboardApi } from '../api';
import { useTurmaContext } from '../../turmas/context/TurmaContext';
import { useAuth } from '../../auth/hooks/useAuthProvider';
import ProfessorDashboardView from './ProfessorDashboardView';

const date = (value) => new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const situations = { ABERTA: 'Aberta', AGENDADA: 'Agendada', ENCERRADA: 'Encerrada', RASCUNHO: 'Rascunho' };
const statuses = { AVALIADA: 'Avaliada', PROCESSANDO: 'Em avaliação', ERRO_COMPILACAO: 'Erro de compilação', FALHA_TECNICA: 'Falha técnica · sem nota', ASSINATURA_NAO_SUPORTADA: 'Assinatura não suportada', ENVIO_REGISTRADO: 'Envio registrado · resultado após encerramento' };

function Panel({ title, children, ...props }) {
  return <Card variant="outlined" {...props}><CardContent><Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>{children}</CardContent></Card>;
}

export default function ClassDashboard({ professor }) {
  const { turmaAtiva } = useTurmaContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState({ data: null, error: '', key: null });
  const [reload, setReload] = useState(0);
  const [copyMessage, setCopyMessage] = useState('');
  const turmaUuid = turmaAtiva?.uuid;
  const key = `${turmaUuid}:${professor}:${reload}`;

  useEffect(() => {
    let active = true;
    if (!turmaUuid) return undefined;
    const request = professor ? dashboardApi.getEstatisticas : dashboardApi.getDashboardAluno;
    request(turmaUuid).then((data) => {
      if (active) setState({ data, error: '', key });
    }).catch(() => {
      if (active) setState({ data: null, error: 'Não foi possível carregar o início desta turma.', key });
    });
    return () => { active = false; };
  }, [turmaUuid, professor, key]);

  if (!turmaUuid) return <Alert severity="info">Selecione uma turma para começar.</Alert>;
  const loading = state.key !== key;
  const data = loading ? null : state.data;
  const atividades = data?.atividades || [];
  const abertas = atividades.filter((a) => a.situacao === 'ABERTA');
  const proxima = abertas.find((a) => a.funcoesEnviadas < a.totalFuncoes);
  const atividadePath = (id) => `${professor ? '' : '/aluno'}/atividades/${id}`;
  const copyCode = async () => {
    try { await navigator.clipboard.writeText(data.codigo); setCopyMessage('Código copiado!'); }
    catch { setCopyMessage('Não foi possível copiar. Selecione o código e copie manualmente.'); }
  };

  if (professor) return <ProfessorDashboardView
    key={turmaUuid}
    data={data}
    turma={turmaAtiva}
    nome={user?.nome}
    loading={loading}
    error={loading ? '' : state.error}
    onRetry={() => setReload((n) => n + 1)}
  />;

  return <Stack spacing={3}>
    <Box><Typography variant="overline" color="primary.main">{turmaAtiva.nome}</Typography>
      <Typography variant="h4">Olá, {user?.nome?.split(' ')[0] || 'bem-vindo'}!</Typography>
      <Typography color="text.secondary">{professor ? 'Acompanhe a participação e os próximos prazos da sua turma.' : 'Um passo de cada vez. Continue sua prática em C.'}</Typography>
    </Box>
    {!loading && state.error && <Alert severity="error" action={<Button onClick={() => setReload((n) => n + 1)}>Tentar novamente</Button>}>{state.error}</Alert>}
    {loading ? <Stack spacing={2}><Skeleton variant="rounded" height={180} /><Skeleton variant="rounded" height={280} /></Stack> : data && <>
      {professor ? <Panel title="Convide seus alunos" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ sm: 'center' }} justifyContent="space-between">
          <Box><Typography sx={{ opacity: 0.85 }}>Código de ingresso da turma</Typography><Typography variant="h3" sx={{ fontFamily: 'monospace', letterSpacing: 4, overflowWrap: 'anywhere' }}>{data.codigo || 'Indisponível'}</Typography></Box>
          <Button color="inherit" variant="outlined" disabled={!data.codigo} onClick={copyCode}>Copiar código</Button>
        </Stack><Typography variant="body2" sx={{ mt: 2 }}>Compartilhe este código para que os alunos ingressem na turma.</Typography>
        {copyMessage && <Typography role="status" sx={{ mt: 1 }}>{copyMessage}</Typography>}
      </Panel> : <Panel title={proxima ? 'Sua próxima atividade' : 'Tudo em dia por aqui'} sx={{ borderColor: 'primary.main', bgcolor: 'action.hover' }}>
        {proxima ? <><Chip size="small" label={proxima.tipo === 'PROVA' ? 'Prova' : 'Exercício'} /><Typography variant="h5" sx={{ mt: 1 }}>{proxima.titulo}</Typography>
          <Typography color="text.secondary" sx={{ my: 1 }}>{proxima.funcoesEnviadas} de {proxima.totalFuncoes} funções com envio · Prazo {date(proxima.fimEm)}</Typography>
          <Button variant="contained" onClick={() => navigate(atividadePath(proxima.uuid))}>{proxima.funcoesEnviadas ? 'Continuar atividade' : 'Começar atividade'}</Button></>
          : <Typography color="text.secondary">{abertas.length ? 'Todas as funções das atividades abertas têm envio registrado. Você ainda pode consultar suas atividades.' : 'Nenhuma atividade aberta neste momento. Acompanhe os próximos prazos abaixo.'}</Typography>}
      </Panel>}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
        {(professor ? [[data.totalAlunos, 'Alunos matriculados'], [data.atividadesAbertas, 'Atividades abertas'], [atividades.filter((a) => a.situacao === 'AGENDADA').length, 'Atividades agendadas']]
          : [[data.atividadesAbertas, 'Atividades abertas'], [data.atividadesIniciadas, 'Atividades iniciadas'], [data.funcoesEnviadas, 'Funções com envio registrado']]).map(([value, label]) => <Card variant="outlined" key={label}><CardContent><Typography variant="h4">{value}</Typography><Typography color="text.secondary">{label}</Typography></CardContent></Card>)}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.6fr) minmax(0, 1fr)' }, gap: 3, alignItems: 'start' }}>
        <Panel title={professor ? 'Participação e próximos prazos' : 'Suas atividades'}>
          {!atividades.length && <Typography color="text.secondary">{professor ? 'Sua turma ainda não tem atividades.' : 'O professor ainda não publicou atividades para esta turma.'}</Typography>}
          <Stack spacing={3}>{atividades.slice(0, 6).map((a) => <Box key={a.uuid}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between"><Typography fontWeight={700}>{a.titulo}</Typography><Chip size="small" label={situations[a.situacao]} color={a.situacao === 'ABERTA' ? 'success' : 'default'} /></Stack>
            <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>{a.tipo === 'PROVA' ? 'Prova' : 'Exercício'} · Prazo {date(a.fimEm)}</Typography>
            {professor ? <Typography variant="body2">{a.alunosIniciaram} de {data.totalAlunos} alunos iniciaram · {a.alunosEnviaramTodas} enviaram todas as funções</Typography>
              : <><Typography variant="body2">{a.funcoesEnviadas} de {a.totalFuncoes} funções com envio registrado</Typography><LinearProgress aria-label={`Progresso de envios: ${a.titulo}`} variant="determinate" value={a.totalFuncoes ? 100 * a.funcoesEnviadas / a.totalFuncoes : 0} sx={{ mt: 1, height: 6, borderRadius: 3 }} /></>}
            <Button size="small" sx={{ mt: 1 }} onClick={() => navigate(atividadePath(a.uuid))}>{professor ? 'Acompanhar atividade' : 'Ver atividade'}</Button>
          </Box>)}</Stack>
          {atividades.length > 6 && <Button onClick={() => navigate(professor ? '/atividades' : '/aluno/atividades')}>Ver todas as atividades</Button>}
        </Panel>
        <Stack spacing={3}><Panel title={professor ? 'Submissões recentes' : 'Seus últimos envios'}>
          {!data.recentes.length && <Typography color="text.secondary">Nenhuma submissão registrada nesta turma.</Typography>}
          <Stack spacing={2}>{data.recentes.map((t) => <Box key={t.uuid}>
            {professor && <Typography fontWeight={700}>{t.alunoNome}</Typography>}
            <Typography variant="body2">{t.atividadeTitulo} · {t.funcaoNome}</Typography>
            <Typography variant="caption" color="text.secondary">{date(t.recebidaEm)}</Typography>
            <Typography variant="body2" color={t.status === 'FALHA_TECNICA' ? 'warning.main' : 'text.secondary'}>{statuses[t.status] || 'Envio registrado'}{t.nota != null && ` · ${Number(t.nota).toLocaleString('pt-BR')} / ${Number(t.notaMaxima).toLocaleString('pt-BR')} pontos`}</Typography>
            <Button size="small" onClick={() => navigate(professor ? `/atividades/${t.atividadeUuid}/funcao/${t.funcaoUuid}/submissoes` : `/aluno/submissoes/${t.uuid}`)}>Ver detalhes</Button>
          </Box>)}</Stack>
        </Panel>{!professor && <Panel title="Espaço para praticar"><Typography color="text.secondary" sx={{ mb: 2 }}>Experimente código C no playground, sem nota e sem consumir tentativas das atividades.</Typography><Button variant="outlined" onClick={() => navigate('/aluno/sandbox')}>Praticar código C</Button></Panel>}</Stack>
      </Box>
    </>}
  </Stack>;
}

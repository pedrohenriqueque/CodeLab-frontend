import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import { Alert, Avatar, Box, Button, Card, Chip, Divider, LinearProgress, Skeleton, Stack, Typography } from '@mui/material';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';

const states = {
  ABERTA: ['Aberta', 'success'], AGENDADA: ['Agendada', 'info'],
  ENCERRADA: ['Encerrada', 'default'], RASCUNHO: ['Rascunho', 'warning'],
};
const attemptStates = {
  AVALIADA: 'Avaliada', PROCESSANDO: 'Em avaliação', FALHA_TECNICA: 'Falha técnica · sem nota',
  ERRO_COMPILACAO: 'Erro de compilação',
  ASSINATURA_NAO_SUPORTADA: 'Assinatura não suportada',
};
const formatDate = (value) => new Date(value).toLocaleString('pt-BR', {
  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
});

function SectionHeading({ title, description, count }) {
  return <Box sx={{ px: 2.5, py: 1.5, bgcolor: 'action.hover' }}>
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
      <Typography variant="h6" component="h2" sx={{ fontSize: '1rem', fontWeight: 700 }}>{title}</Typography>
      {count != null && <Chip size="small" label={count} sx={{ height: 23 }} />}
    </Stack>
    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>{description}</Typography>
  </Box>;
}

export default function ProfessorDashboardView({ data, turma, nome, loading, error, onRetry }) {
  const navigate = useNavigate();
  const [copyState, setCopyState] = useState('');
  const activities = data?.atividades || [];
  const recent = data?.recentes || [];
  const metrics = [
    { label: 'Alunos matriculados', value: data?.totalAlunos, hint: 'Participantes da turma', Icon: GroupsOutlinedIcon, color: 'primary' },
    { label: 'Atividades abertas', value: data?.atividadesAbertas, hint: 'Recebendo submissões', Icon: AssignmentOutlinedIcon, color: 'success' },
    { label: 'Atividades agendadas', value: activities.filter((a) => a.situacao === 'AGENDADA').length, hint: 'Com abertura futura', Icon: CalendarTodayOutlinedIcon, color: 'info' },
  ];
  const copy = async () => {
    try { await navigator.clipboard.writeText(data.codigo); setCopyState('success'); }
    catch { setCopyState('error'); }
  };

  return <Stack spacing={1.5}>
    <Box>
      <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700, letterSpacing: '0.1em' }}>Visão geral da turma</Typography>
      <Typography variant="h4" component="h1" sx={{ mt: 0, mb: 0.25, fontSize: { xs: '1.6rem', md: '1.6rem' } }}>Olá, {nome?.split(' ')[0] || 'professor'}.</Typography>
      <Typography color="text.secondary">Acompanhe o que está acontecendo em <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>{turma.nome}</Box>.</Typography>
    </Box>

    {error && <Alert severity="error" action={<Button onClick={onRetry}>Tentar novamente</Button>}>{error}</Alert>}
    {loading ? <Stack spacing={1.5} aria-label="Carregando painel"><Skeleton variant="rounded" height={96} /><Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>{[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={66} />)}</Box><Skeleton variant="rounded" height={320} /></Stack> : data && <>
      <Card variant="outlined" sx={(theme) => ({
        p: { xs: 1.5, md: 2 }, position: 'relative', overflow: 'hidden',
        borderColor: alpha(theme.palette.primary.main, 0.16), boxShadow: 'none',
        background: `linear-gradient(110deg, ${alpha(theme.palette.primary.main, 0.09)}, ${theme.palette.background.paper} 75%)`,
      })}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { md: 'center' } }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start", maxWidth: 470 }}>
            <Avatar variant="rounded" sx={(theme) => ({ width: 40, height: 40, bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main' })}><GroupsOutlinedIcon /></Avatar>
            <Box><Typography component="h2" variant="h6" sx={{ mb: 0.25, fontSize: '1rem' }}>Convide seus alunos</Typography><Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>Um código, toda a turma conectada.</Typography></Box>
          </Stack>
          <Box sx={{ minWidth: 0, width: { xs: '100%', md: 'auto' } }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.08em' }}>CÓDIGO DE INGRESSO</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' }, mt: 0.5 }}>
              <Box sx={{ px: 1.5, py: 0.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}><Typography sx={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 700, letterSpacing: '0.12em', overflowWrap: 'anywhere', userSelect: 'all' }}>{data.codigo || 'Indisponível'}</Typography></Box>
              <Button variant="contained" disabled={!data.codigo} onClick={copy} startIcon={copyState === 'success' ? <CheckRoundedIcon /> : <ContentCopyOutlinedIcon />} sx={{ whiteSpace: 'nowrap' }}>{copyState === 'success' ? 'Copiado' : 'Copiar código'}</Button>
            </Stack>
            <Box role="status" aria-live="polite">{copyState && <Typography variant="caption" color={copyState === 'error' ? 'error.main' : 'success.main'}>{copyState === 'error' ? 'Não foi possível copiar. Selecione o código para copiar manualmente.' : 'Código copiado para compartilhar.'}</Typography>}</Box>
          </Box>
        </Stack>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
        {metrics.map(({ label, value, Icon, color }) => <Card variant="outlined" key={label} sx={(theme) => ({
          px: 2, py: 1.25, minHeight: 68, display: 'flex', alignItems: 'center',
          boxShadow: 'none', borderColor: alpha(theme.palette[color].main, 0.18),
        })}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '36px minmax(0, 1fr) auto', alignItems: 'center', columnGap: 1.5, width: '100%' }}>
            <Avatar variant="rounded" sx={(theme) => ({ width: 36, height: 36, bgcolor: alpha(theme.palette[color].main, 0.09), color: `${color}.main` })}><Icon sx={{ fontSize: 19 }} /></Avatar>
            <Typography variant="body2" sx={{ lineHeight: 1.4, fontWeight: 600, color: 'text.secondary' }}>{label}</Typography>
            <Typography sx={{ lineHeight: 1, fontSize: '1.65rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>{value ?? '—'}</Typography>
          </Box>
        </Card>)}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.35fr) minmax(0, 1fr)' }, gap: 2, alignItems: 'stretch' }}>
        <Card variant="outlined" sx={{ boxShadow: 'none', overflow: 'hidden' }}>
          <SectionHeading title="Atividades da turma" description="Participação dos alunos e prazos de encerramento." count={activities.length} />
          <Divider />
          {!activities.length && <Box sx={{ p: 4, textAlign: 'center' }}><AssignmentOutlinedIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} /><Typography fontWeight={600}>Ainda não há atividades</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>As atividades criadas para esta turma aparecerão aqui.</Typography></Box>}
          {activities.slice(0, 3).map((activity, index) => {
            const [label, color] = states[activity.situacao] || [activity.situacao, 'default'];
            const participation = data.totalAlunos ? Math.min(100, activity.alunosIniciaram / data.totalAlunos * 100) : 0;
            return <Box key={activity.uuid} sx={{ px: 2, py: 1.25, transition: 'background-color 150ms ease', '&:hover': { bgcolor: 'action.hover' }, borderTop: index ? '1px solid' : 0, borderColor: 'divider' }}>
              <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box sx={{ minWidth: 0 }}><Typography variant="body2" fontWeight={700} noWrap title={activity.titulo}>{activity.titulo}</Typography></Box>
                <Chip size="small" color={color} variant="outlined" label={label} sx={{ flexShrink: 0, height: 22, fontSize: '0.7rem' }} />
              </Stack>
              <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mt: 0.25, mb: 0.5 }}><CalendarTodayOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary' }} /><Typography variant="caption" color="text.secondary">{activity.tipo === 'PROVA' ? 'Prova' : 'Exercício'} · {formatDate(activity.fimEm)}</Typography></Stack>
              <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", mb: 0.25 }}><Typography variant="caption" color="text.secondary">Alunos que iniciaram</Typography><Typography variant="caption" fontWeight={700}>{activity.alunosIniciaram} / {data.totalAlunos}</Typography></Stack>
              <LinearProgress variant="determinate" value={participation} aria-label={`Alunos que iniciaram ${activity.titulo}`} sx={{ height: 5, borderRadius: 3, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 3 } }} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: "space-between", alignItems: { sm: 'center' }, mt: 0.25 }}><Typography variant="caption" color="text.secondary">{activity.alunosEnviaramTodas} enviaram todas as funções</Typography><Button size="small" sx={{ py: 0.25, minHeight: 24 }} endIcon={<ArrowForwardRoundedIcon />} onClick={() => navigate(`/atividades/${activity.uuid}`)}>Acompanhar</Button></Stack>
            </Box>;
          })}
          {activities.length > 3 && <Box sx={{ px: 2, py: 0.25, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}><Button onClick={() => navigate('/atividades')}>Ver todas as atividades</Button></Box>}
        </Card>

        <Card variant="outlined">
          <SectionHeading title="Últimos envios" description="As submissões mais recentes desta turma." />
          <Divider />
          {!recent.length && <Box sx={{ p: 4, textAlign: 'center' }}><Typography fontWeight={600}>Aguardando os primeiros envios</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Quando os alunos enviarem suas soluções, você poderá acompanhá-las aqui.</Typography></Box>}
          {recent.slice(0, 3).map((attempt, index) => <Box key={attempt.uuid} sx={{ px: 2, py: 1.25, transition: 'background-color 150ms ease', '&:hover': { bgcolor: 'action.hover' }, borderTop: index ? '1px solid' : 0, borderColor: 'divider' }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
              <Avatar sx={(theme) => ({ width: 34, height: 34, fontSize: '0.75rem', fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.09), color: 'primary.main' })}>{(attempt.alunoNome || 'Aluno').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('')}</Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "baseline" }}>
                  <Typography variant="body2" fontWeight={700} noWrap title={attempt.alunoNome}>{attempt.alunoNome || 'Aluno'}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{formatDate(attempt.recebidaEm)}</Typography>
                </Stack>
                <Typography variant="body2" noWrap title={attempt.atividadeTitulo} sx={{ mt: 0.25 }}>{attempt.atividadeTitulo}</Typography>
                <Typography variant="caption" component="div" noWrap title={`${attempt.funcaoNome}()`} sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{attempt.funcaoNome}()</Typography>
                <Typography variant="caption" sx={{ display: "block", mt: 0.25 }} color={attempt.status === 'FALHA_TECNICA' ? 'warning.main' : 'text.secondary'}>{attemptStates[attempt.status] || 'Envio registrado'}{attempt.nota != null && ` · ${Number(attempt.nota).toLocaleString('pt-BR')} / ${Number(attempt.notaMaxima).toLocaleString('pt-BR')} pts`}</Typography>
                <Button size="small" sx={{ mt: 0, ml: -1, py: 0.25, minHeight: 24 }} onClick={() => navigate(`/atividades/${attempt.atividadeUuid}/funcao/${attempt.funcaoUuid}/submissoes`)}>Ver submissões</Button>
              </Box>
            </Stack>
          </Box>)}
        </Card>
      </Box>
    </>}
  </Stack>;
}

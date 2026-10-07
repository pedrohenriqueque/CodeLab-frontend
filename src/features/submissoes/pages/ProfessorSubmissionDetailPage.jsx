import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Avatar, Box, Button, Card,
  Chip, Dialog, Divider, IconButton, LinearProgress, Skeleton, Stack, Typography,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import { getSubmissao } from '../api';
import ReadOnlyCodeViewer from '../components/ReadOnlyCodeViewer';
import { formatScore, formatSubmissionDate, statusInfo } from '../components/submissionDisplay';
import TestCaseInputs from '../../../shared/components/TestCaseInputs';
import { formatCapturedReturn, formatTestCaseValue } from '../../../shared/components/testCaseValues';

const initials = (name) => name?.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';
const cardStyle = { borderColor: '#DFE7F4', borderRadius: 2, boxShadow: '0 4px 18px rgba(25, 55, 105, 0.035)' };

function SectionTitle({ icon, children, action }) {
  return <Box sx={{ minHeight: 48, px: 1.75, py: 1, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #E6ECF6' }}>
    <Box sx={{ color: '#2458D3', display: 'flex', alignItems: 'center' }}>{icon}</Box>
    <Typography variant="subtitle2" component="h2" sx={{ fontWeight: 800, color: '#18243D', flex: 1 }}>{children}</Typography>
    {action}
  </Box>;
}

function MetadataItem({ icon, title, subtitle, avatar }) {
  return <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, flex: 1, px: { xs: 0, sm: 2 } }}>
    {avatar || <Box sx={{ color: '#3155A0', display: 'flex', alignItems: 'center' }}>{icon}</Box>}
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body2" sx={{ fontWeight: 750, color: '#18243D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</Typography>
    </Box>
  </Stack>;
}

function TestCase({ testCase, index, parametros }) {
  const passed = testCase.aprovado;
  const notExecuted = testCase.statusRetorno === 'NAO_EXECUTADO';
  const executionError = testCase.statusRetorno === 'ERRO_EXECUCAO';
  return <Accordion disableGutters defaultExpanded={!passed} elevation={0} sx={{ border: '1px solid #E2EAF6', borderRadius: '8px !important', overflow: 'hidden', '&:before': { display: 'none' }, '& + &': { mt: 0.55 } }}>
    <AccordionSummary expandIcon={<ExpandMoreRoundedIcon sx={{ fontSize: 18 }} />} sx={{ minHeight: '34px !important', px: 1.1, bgcolor: passed || notExecuted ? '#fff' : '#FFF0F2', '& .MuiAccordionSummary-content': { my: '5px !important', alignItems: 'center', gap: 0.85 } }}>
      <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#F0F4FB', color: '#31528E', display: 'grid', placeItems: 'center', fontSize: '0.68rem', fontWeight: 800 }}>{index + 1}</Box>
      <Typography variant="caption" sx={{ flex: 1, fontWeight: 700, color: '#263854' }}>Caso {index + 1}</Typography>
      <Chip size="small" icon={passed ? <CheckCircleRoundedIcon /> : <ErrorRoundedIcon />} label={notExecuted ? 'Não executado' : executionError ? 'Erro de execução' : passed ? 'Aprovado' : 'Reprovado'} sx={{ height: 22, bgcolor: notExecuted ? '#F1F5F9' : passed ? '#E7F8EE' : '#FFE8EB', color: notExecuted ? '#64748B' : passed ? '#176B3A' : '#A82232', fontSize: '0.65rem', fontWeight: 750, '& .MuiChip-icon': { color: 'inherit', fontSize: 14 } }} />
    </AccordionSummary>
    <AccordionDetails sx={{ px: 1.4, py: 0.9, bgcolor: '#F9FBFF', borderTop: '1px solid #E9EEF8' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
        {[['Entrada', testCase.entradas], ['Esperado', testCase.retornoEsperado], ['Obtido', testCase.retornoObtido]].map(([label, value]) => <Box key={label} sx={{ px: 1, '& + &': { borderLeft: { xs: 0, sm: '1px solid #E1E8F4' } } }}>
          <Typography sx={{ color: '#74839D', fontSize: '0.65rem' }}>{label}</Typography>
          <Box sx={{ fontFamily: 'Consolas, monospace', fontSize: '0.72rem', color: '#18243D', overflowWrap: 'anywhere' }}>
            {label === 'Entrada' ? <TestCaseInputs entradas={value} parametros={parametros} /> : label === 'Obtido' ? formatCapturedReturn(testCase) : formatTestCaseValue(value)}
          </Box>
        </Box>)}
      </Box>
    </AccordionDetails>
  </Accordion>;
}

export default function ProfessorSubmissionDetailPage() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    getSubmissao(uuid, { includeParameters: true }).then((item) => { if (active) { setSubmission(item); setLoading(false); setError(''); } })
      .catch((err) => { if (active) { setError(err.response?.data?.erro || 'Não foi possível carregar a submissão.'); setLoading(false); } });
    return () => { active = false; };
  }, [uuid, reload]);

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(submission.codigoSubmetido); setCopied(true); }
    catch { setCopied(false); }
  };
  const status = submission ? statusInfo(submission.status) : null;
  const caseResults = submission?.status === 'AVALIADA' ? submission.resultadosCasos || [] : [];
  const passed = submission?.casosAprovados;
  const total = submission?.totalCasos;
  const percentage = total > 0 && passed != null ? Math.min(100, passed / total * 100) : 0;
  const evaluated = submission?.status === 'AVALIADA';
  const compilationError = submission?.status === 'ERRO_COMPILACAO';

  return <Box sx={{ maxWidth: 1320, mx: 'auto', pb: 2 }}>
    <Button size="small" startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/submissoes')} sx={{ mb: 1.5, px: 0.5, textTransform: 'none', fontWeight: 700 }}>Voltar às submissões</Button>

    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} sx={{ mb: 1.7 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
        <AssignmentOutlinedIcon sx={{ fontSize: 40, color: '#2458D3' }} />
        <Box><Typography component="h1" sx={{ color: '#172033', fontWeight: 800, fontSize: { xs: '1.45rem', md: '1.85rem' }, lineHeight: 1.12 }}>Detalhes da submissão</Typography><Typography variant="body2" color="text.secondary">Consulte o código enviado e o resultado da correção.</Typography></Box>
      </Stack>
      {submission && <Chip icon={submission.status === 'AVALIADA' ? <CheckCircleRoundedIcon /> : undefined} label={status.label} color={status.color} sx={{ height: 32, fontWeight: 750, flexShrink: 0 }} />}
    </Stack>

    {error && <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={() => { setLoading(true); setReload((n) => n + 1); }}>Tentar novamente</Button>}>{error}</Alert>}
    {loading ? <Stack spacing={1.5}><Skeleton variant="rounded" height={62} /><Skeleton variant="rounded" height={430} /></Stack> : submission && <>
      <Card variant="outlined" sx={{ ...cardStyle, mb: 1.5, py: 1.15, px: { xs: 2, sm: 0.5 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1.5, sm: 0 }} divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />}>
          <MetadataItem title={submission.alunoNome || 'Aluno não identificado'} subtitle={submission.alunoMatricula || 'Matrícula indisponível'} avatar={<Avatar sx={{ width: 38, height: 38, bgcolor: '#E4EBFF', color: '#2458D3', fontSize: 13, fontWeight: 800 }}>{initials(submission.alunoNome)}</Avatar>} />
          <MetadataItem icon={<MenuBookOutlinedIcon />} title={submission.atividadeTitulo} subtitle={`${submission.funcaoNome}()`} />
          <MetadataItem icon={<CalendarTodayOutlinedIcon />} title="Enviada em" subtitle={formatSubmissionDate(submission.dataSubmissao)} />
        </Stack>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.15fr) minmax(0, 0.85fr)' }, gap: 1.5, alignItems: 'start' }}>
        <Card variant="outlined" sx={{ ...cardStyle, overflow: 'hidden' }}>
          <SectionTitle icon={<CodeRoundedIcon fontSize="small" />} action={<Stack direction="row" spacing={0.5}>
            <Button size="small" startIcon={<ContentCopyOutlinedIcon sx={{ fontSize: 16 }} />} disabled={!submission.codigoSubmetido} onClick={copyCode} sx={{ minWidth: 0, fontSize: '0.7rem', textTransform: 'none' }}>{copied ? 'Copiado' : 'Copiar código'}</Button>
            <Button size="small" startIcon={<FullscreenRoundedIcon sx={{ fontSize: 16 }} />} onClick={() => setFullScreen(true)} sx={{ minWidth: 0, fontSize: '0.7rem', textTransform: 'none' }}>Tela cheia</Button>
          </Stack>}>Código enviado</SectionTitle>
          <ReadOnlyCodeViewer code={submission.codigoSubmetido} />
        </Card>

        <Stack spacing={1.25}>
          <Card variant="outlined" sx={cardStyle}>
            <SectionTitle icon={<CheckCircleRoundedIcon fontSize="small" />}>Resultado da correção</SectionTitle>
            <Box sx={{ px: 1.75, py: 1.2 }}>
              {submission.falhaTecnica ? <Alert severity="warning">A correção não foi concluída por falha técnica. Esta tentativa não recebeu nota.</Alert> : submission.status === 'PROCESSANDO' ? <Alert severity="info">Esta tentativa está aguardando avaliação.</Alert> : submission.status === 'ASSINATURA_NAO_SUPORTADA' ? <Alert severity="warning">A assinatura da função não foi suportada. Esta tentativa não recebeu nota.</Alert> : <>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', mb: 0.65 }}>
                  <Box sx={{ pr: 1.5 }}><Typography sx={{ color: '#71819A', fontSize: '0.68rem' }}>Nota desta tentativa</Typography><Typography sx={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.1, color: '#17233E' }}>{formatScore(submission.nota, submission.pontosTotal)}</Typography></Box>
                  <Box sx={{ pl: 1.5, borderLeft: '1px solid #DEE6F3' }}><Typography sx={{ color: '#71819A', fontSize: '0.68rem' }}>Casos aprovados</Typography><Typography sx={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.1, color: '#17233E' }}>{evaluated ? `${passed ?? 0} / ${total ?? 0}` : '—'}</Typography></Box>
                </Box>
                {evaluated && total > 0 && <><LinearProgress variant="determinate" color="success" value={percentage} sx={{ height: 7, borderRadius: 5, bgcolor: '#E4EAF4' }} /><Typography sx={{ color: '#74839D', fontSize: '0.65rem', textAlign: 'right', mt: 0.35 }}>{Math.round(percentage)}% dos casos aprovados</Typography></>}
                {compilationError && <Alert severity="error" sx={{ mt: 1, py: 0 }}>O código não compilou; nenhum caso foi executado.</Alert>}
                <Box sx={{ mt: 1.1, px: 1, py: 0.75, border: '1px solid #E0E9F5', borderRadius: 1.25, bgcolor: '#F8FBFF', display: 'flex', alignItems: 'center', gap: 1 }}>
                  {compilationError ? <ErrorRoundedIcon sx={{ fontSize: 16, color: '#BE2B42' }} /> : <CheckCircleRoundedIcon sx={{ fontSize: 16, color: '#21825A' }} />}
                  <Typography sx={{ fontSize: '0.7rem', color: '#5F6E87', flex: 1 }}>Situação da avaliação</Typography>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 750, color: compilationError ? '#A82232' : '#176B3A' }}>{status.label}</Typography>
                </Box>
              </>}
            </Box>
          </Card>

          <Card variant="outlined" sx={cardStyle}>
            <SectionTitle icon={<ScienceOutlinedIcon fontSize="small" />}>Casos de teste</SectionTitle>
            <Box sx={{ p: 1.1, maxHeight: 350, overflowY: 'auto' }}>
              {caseResults.length ? caseResults.map((testCase, index) => <TestCase key={testCase.casoTesteAtividadeUuid || index} testCase={testCase} index={index} parametros={submission.parametros} />)
                : <Typography variant="body2" color="text.secondary" sx={{ px: 0.75, py: 1 }}>{compilationError ? 'Nenhum caso foi executado porque o código não compilou.' : 'Não há resultados por caso disponíveis para esta tentativa.'}</Typography>}
            </Box>
          </Card>
        </Stack>
      </Box>
    </>}

    <Dialog open={fullScreen} onClose={() => setFullScreen(false)} fullScreen>
      <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #E0E7F2' }}><CodeRoundedIcon color="primary" /><Typography sx={{ fontWeight: 800, flex: 1 }}>Código enviado · {submission?.funcaoNome}()</Typography><IconButton aria-label="Fechar tela cheia" onClick={() => setFullScreen(false)}><CloseRoundedIcon /></IconButton></Box>
      <Box sx={{ flex: 1, minHeight: 0 }}><ReadOnlyCodeViewer code={submission?.codigoSubmetido} fullScreen /></Box>
    </Dialog>
  </Box>;
}

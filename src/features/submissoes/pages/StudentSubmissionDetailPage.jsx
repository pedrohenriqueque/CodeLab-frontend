/**
 * StudentSubmissionDetailPage — Detalhes da submissão do aluno.
 *
 * Exibe o código enviado e o status da submissão de acordo com o tipo da atividade:
 * - Trabalho avaliativo (ou resultado restrito): Exibe aviso pedagógico com restrição de notas e casos.
 * - Exercício de prática (ou resultado liberado): Exibe nota, barra de progresso e casos visíveis avaliados.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  Divider,
  IconButton,
  LinearProgress,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

// Ícones Material UI
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import CheckIcon from '@mui/icons-material/Check';
import TagRoundedIcon from '@mui/icons-material/TagRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { getSubmissao, getSubmissoes } from '../api';
import ReadOnlyCodeViewer from '../components/ReadOnlyCodeViewer';
import { formatScore, formatSubmissionDate } from '../components/submissionDisplay';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';

const cardStyle = {
  borderColor: '#E2E8F0',
  borderRadius: 3,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  backgroundColor: '#FFFFFF',
};

const displayValue = (value) =>
  value == null ? '—' : typeof value === 'string' ? value : JSON.stringify(value);

function SectionTitle({ icon, children, action }) {
  return (
    <Box
      sx={{
        minHeight: 48,
        px: 2,
        py: 1.25,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        borderBottom: '1px solid #E2E8F0',
      }}
    >
      <Box sx={{ color: '#2563EB', display: 'flex', alignItems: 'center' }}>{icon}</Box>
      <Typography
        variant="subtitle2"
        component="h2"
        sx={{ fontWeight: 700, color: '#0F172A', flex: 1, fontSize: '0.95rem' }}
      >
        {children}
      </Typography>
      {action}
    </Box>
  );
}

function MetadataItem({ icon, label, value }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, flex: 1, px: { xs: 0, sm: 2 } }}>
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: '50%',
          bgcolor: '#EFF6FF',
          color: '#2563EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 500, fontSize: '0.75rem' }}>
          {label}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            color: '#0F172A',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '0.95rem',
          }}
        >
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

function VisibleTestCase({ testCase, index, isNaoExecutado, isErroCompilacao }) {
  const passed = Boolean(testCase.aprovado);
  const isNeutral = Boolean(isNaoExecutado || testCase.naoExecutado);
  return (
    <Accordion
      disableGutters
      defaultExpanded={!passed && !isNeutral}
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: isNeutral ? '#E2EAF6' : passed ? '#A7F3D0' : '#FECACA',
        borderRadius: '8px !important',
        overflow: 'hidden',
        '&:before': { display: 'none' },
        '& + &': { mt: 0.75 },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreRoundedIcon sx={{ fontSize: 18 }} />}
        sx={{
          minHeight: '36px !important',
          px: 1.5,
          bgcolor: isNeutral ? '#F8FAFC' : passed ? '#fff' : '#FFF5F5',
          '& .MuiAccordionSummary-content': { my: '6px !important', alignItems: 'center', gap: 1 },
        }}
      >
        <Box
          sx={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            bgcolor: '#EFF6FF',
            color: '#2563EB',
            display: 'grid',
            placeItems: 'center',
            fontSize: '0.72rem',
            fontWeight: 800,
          }}
        >
          {index + 1}
        </Box>
        <Typography variant="body2" sx={{ flex: 1, fontWeight: 700, color: '#1E293B' }}>
          Caso {index + 1}
        </Typography>
        {isNeutral ? (
          <Tooltip
            title={
              isErroCompilacao
                ? 'Caso de teste não executado devido a erro de compilação no GCC.'
                : 'Caso de teste não avaliado devido a falha técnica.'
            }
            arrow
          >
            <Chip
              size="small"
              icon={<InfoOutlinedIcon sx={{ fontSize: '15px !important', color: '#64748B !important' }} />}
              label="Não executado"
              sx={{
                height: 24,
                bgcolor: '#F1F5F9',
                color: '#475569',
                fontSize: '0.7rem',
                fontWeight: 700,
                border: '1px solid #CBD5E1',
                '& .MuiChip-icon': { color: 'inherit', fontSize: 15 },
              }}
            />
          </Tooltip>
        ) : (
          <Chip
            size="small"
            icon={passed ? <CheckCircleRoundedIcon /> : <ErrorRoundedIcon />}
            label={passed ? 'Aprovado' : 'Reprovado'}
            sx={{
              height: 24,
              bgcolor: passed ? '#ECFDF5' : '#FEF2F2',
              color: passed ? '#059669' : '#DC2626',
              fontSize: '0.7rem',
              fontWeight: 700,
              border: `1px solid ${passed ? '#A7F3D0' : '#FECACA'}`,
              '& .MuiChip-icon': { color: 'inherit', fontSize: 15 },
            }}
          />
        )}
      </AccordionSummary>
      <AccordionDetails sx={{ px: 2, py: 1.25, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 }}>
          <Box>
            <Typography sx={{ color: '#64748B', fontSize: '0.7rem', fontWeight: 600, mb: 0.25 }}>
              Entrada(s)
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Consolas, monospace',
                fontSize: '0.78rem',
                color: '#0F172A',
                bgcolor: '#fff',
                p: 0.75,
                borderRadius: 1.5,
                border: '1px solid #E2E8F0',
                overflowWrap: 'anywhere',
              }}
            >
              {displayValue(testCase.entradas)}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ color: '#64748B', fontSize: '0.7rem', fontWeight: 600, mb: 0.25 }}>
              Retorno Esperado
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Consolas, monospace',
                fontSize: '0.78rem',
                color: '#16A34A',
                fontWeight: 700,
                bgcolor: '#fff',
                p: 0.75,
                borderRadius: 1.5,
                border: '1px solid #E2E8F0',
                overflowWrap: 'anywhere',
              }}
            >
              {displayValue(testCase.retornoEsperado)}
            </Typography>
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

export default function StudentSubmissionDetailPage() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useSnackbar();

  const [submissao, setSubmissao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    let active = true;
    getSubmissao(uuid)
      .then(async (item) => {
        if (!active) return;
        let finalItem = item;
        const funcUuid = finalItem?.funcaoUuid || finalItem?.funcao_atividade_uuid;
        const ativUuid = finalItem?.atividadeUuid;
        if (funcUuid && (!finalItem.tentativaNumero || finalItem.tentativaNumero > 1)) {
          try {
            const allSubs = await getSubmissoes();
            const subsDestaFuncao = allSubs.filter(
              (s) => (s.funcaoUuid === funcUuid || s.funcao_atividade_uuid === funcUuid) &&
                     (!ativUuid || s.atividadeUuid === ativUuid)
            );
            const pos = subsDestaFuncao.findIndex((s) => s.uuid === item.uuid);
            if (pos !== -1) {
              const num = subsDestaFuncao.length - pos;
              finalItem = { ...finalItem, tentativaNumero: num };
            }
          } catch (e) {
            console.error('Erro ao calcular tentativaNumero:', e);
          }
        }
        setSubmissao(finalItem);
        setLoading(false);
        setError('');
      })
      .catch((err) => {
        if (active) {
          setError(err.response?.data?.detail || err.response?.data?.erro || 'Não foi possível carregar a submissão.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [uuid]);

  const copyCode = async () => {
    if (!submissao?.codigoSubmetido) return;
    try {
      await navigator.clipboard.writeText(submissao.codigoSubmetido);
      setCopied(true);
      showSuccess('Código copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', pb: 4, pt: 1 }}>
        <Skeleton variant="text" width={180} height={32} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={60} sx={{ mb: 2, borderRadius: 3 }} />
        <Skeleton variant="rounded" height={80} sx={{ mb: 3, borderRadius: 3 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.45fr 1fr' }, gap: 2.5 }}>
          <Skeleton variant="rounded" height={420} sx={{ borderRadius: 3 }} />
          <Skeleton variant="rounded" height={360} sx={{ borderRadius: 3 }} />
        </Box>
      </Box>
    );
  }

  if (error || !submissao) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', py: 6, textAlign: 'center' }}>
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
          {error || 'Submissão não encontrada ou indisponível.'}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/aluno/atividades')} sx={{ textTransform: 'none', borderRadius: 2 }}>
          Ir para minhas atividades
        </Button>
      </Box>
    );
  }

  // Identificação do fluxo: Prova / Restrito vs Exercício / Avaliado
  const isProva = (submissao.atividadeTipo || '').toUpperCase() === 'PROVA';
  const isErroCompilacao = submissao.status === 'ERRO_COMPILACAO';
  const isFalhaTecnica = Boolean(submissao.falhaTecnica || submissao.status === 'FALHA_TECNICA');
  const isNaoExecutado = isErroCompilacao || isFalhaTecnica;
  const isEnvioRegistrado = submissao.status === 'ENVIO_REGISTRADO';
  const isRestrito = (isEnvioRegistrado || (isProva && submissao.nota == null && !isFalhaTecnica)) && !isErroCompilacao;

  const isAvaliada = submissao.status === 'AVALIADA';

  // Cálculos de nota e progresso
  const passed = submissao.casosAprovados ?? 0;
  const total = submissao.totalCasos ?? 0;
  const percentAprovado = total > 0 ? Math.round((passed / total) * 100) : 0;

  // Casos de teste visíveis recebidos do backend
  const visibleCases = (submissao.resultadosCasos || []).filter(
    (c) => (c.visibilidade || '').toUpperCase() !== 'OCULTO'
  );

  const isMaxScore = submissao.nota != null && (submissao.pontosTotal || submissao.notaMaxima) != null &&
    Number(submissao.nota) >= Number(submissao.pontosTotal || submissao.notaMaxima);

  const backToFunctionUrl = !isRestrito && !isMaxScore && submissao.atividadeUuid && submissao.funcaoUuid
    ? `/aluno/atividades/${submissao.atividadeUuid}/funcao/${submissao.funcaoUuid}/submeter`
    : null;

  const backToActivityUrl = submissao.atividadeUuid
    ? `/aluno/atividades/${submissao.atividadeUuid}`
    : '/aluno/atividades';

  const backUrl = backToFunctionUrl || backToActivityUrl;
  const backLabel = backToFunctionUrl ? 'Voltar para a função' : 'Voltar para a atividade';

  return (
    <Box className="fade-in" sx={{ maxWidth: 1200, mx: 'auto', pb: 6 }}>
      {/* ─── Link Superior de Retorno ────────────────────────────── */}
      <Box sx={{ mb: 1.5 }}>
        <Button
          size="small"
          startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 18 }} />}
          onClick={() => navigate(backUrl)}
          sx={{
            px: 0.5,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.875rem',
            color: '#2563EB',
            '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
          }}
        >
          {backLabel}
        </Button>
      </Box>

      {/* ─── Cabeçalho Principal com Título e Badge de Status ────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2.5,
            border: '2px solid #2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563EB',
            bgcolor: '#FFFFFF',
            flexShrink: 0,
          }}
        >
          <AssignmentOutlinedIcon sx={{ fontSize: 28 }} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography
              component="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.4rem', sm: '1.75rem' },
                color: '#0F172A',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              Detalhes da submissão
            </Typography>

            {/* Badge de Status como no design */}
            {isRestrito ? (
              <Chip
                icon={<AccessTimeOutlinedIcon sx={{ fontSize: '15px !important', color: '#FFFFFF !important' }} />}
                label="Recebida"
                sx={{
                  bgcolor: '#334E68',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  height: 28,
                  borderRadius: 2,
                  px: 0.5,
                }}
              />
            ) : isAvaliada ? (
              <>
                <Chip
                  icon={<CheckCircleRoundedIcon sx={{ fontSize: '15px !important', color: '#059669 !important' }} />}
                  label="Avaliada"
                  sx={{
                    bgcolor: '#ECFDF5',
                    color: '#059669',
                    border: '1px solid #A7F3D0',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    height: 28,
                    borderRadius: 2,
                    px: 0.5,
                  }}
                />
                {isMaxScore && (
                  <Chip
                    icon={<CheckCircleRoundedIcon sx={{ fontSize: '15px !important', color: '#15803D !important' }} />}
                    label="Nota máxima atingida"
                    sx={{
                      bgcolor: '#DCFCE7',
                      color: '#15803D',
                      border: '1px solid #86EFAC',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      height: 28,
                      borderRadius: 2,
                      px: 0.5,
                    }}
                  />
                )}
              </>
            ) : isErroCompilacao ? (
              <Chip
                icon={<ErrorRoundedIcon sx={{ fontSize: '15px !important', color: '#DC2626 !important' }} />}
                label="Erro de compilação"
                sx={{
                  bgcolor: '#FEF2F2',
                  color: '#DC2626',
                  border: '1px solid #FECACA',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  height: 28,
                  borderRadius: 2,
                  px: 0.5,
                }}
              />
            ) : isFalhaTecnica ? (
              <Chip
                label="Falha técnica"
                sx={{
                  bgcolor: '#FFFBEB',
                  color: '#D97706',
                  border: '1px solid #FDE68A',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  height: 28,
                  borderRadius: 2,
                  px: 0.5,
                }}
              />
            ) : (
              <Chip
                label={submissao.status}
                sx={{
                  bgcolor: '#F1F5F9',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  height: 28,
                  borderRadius: 2,
                  px: 0.5,
                }}
              />
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {isRestrito
              ? 'Sua tentativa foi enviada com sucesso.'
              : isAvaliada
              ? 'Consulte o código enviado e o resultado da correção.'
              : 'Informações detalhadas desta submissão de código.'}
          </Typography>
        </Box>
      </Box>

      {/* ─── Barra de Metadados Superior (Atividade, Função, Tentativa, Enviada em) ─── */}
      <Card variant="outlined" sx={{ ...cardStyle, mb: 3, py: 1.5, px: { xs: 2, sm: 1 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 2, sm: 0 }}
          divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />}
        >
          <MetadataItem
            icon={<AssignmentOutlinedIcon sx={{ fontSize: 22 }} />}
            label="Atividade"
            value={submissao.atividadeTitulo || 'Atividade'}
          />
          <MetadataItem
            icon={<MenuBookOutlinedIcon sx={{ fontSize: 22 }} />}
            label="Função"
            value={`${submissao.funcaoNome || 'funcao'}()`}
          />
          <MetadataItem
            icon={<TagRoundedIcon sx={{ fontSize: 22 }} />}
            label="Tentativa"
            value={`#${submissao.tentativaNumero || 1}`}
          />
          <MetadataItem
            icon={<CalendarTodayOutlinedIcon sx={{ fontSize: 20 }} />}
            label="Enviada em"
            value={formatSubmissionDate(submissao.dataSubmissao)}
          />
        </Stack>
      </Card>

      {/* ─── Grid Principal: Código Enviado (Esq) × Status e Resultados (Dir) ─── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.45fr 1fr' },
          gap: 2.5,
          alignItems: 'start',
        }}
      >
        {/* Coluna Esquerda: Código Enviado */}
        <Card variant="outlined" sx={{ ...cardStyle, overflow: 'hidden' }}>
          <SectionTitle
            icon={<CodeRoundedIcon fontSize="small" />}
            action={
              <Stack direction="row" spacing={0.5}>
                <Button
                  size="small"
                  startIcon={copied ? <CheckIcon sx={{ fontSize: 16 }} /> : <ContentCopyOutlinedIcon sx={{ fontSize: 16 }} />}
                  onClick={copyCode}
                  sx={{
                    minWidth: 0,
                    fontSize: '0.78rem',
                    textTransform: 'none',
                    fontWeight: 600,
                    color: copied ? '#16A34A' : '#2563EB',
                  }}
                >
                  {copied ? 'Copiado!' : 'Copiar código'}
                </Button>
                <Button
                  size="small"
                  startIcon={<FullscreenRoundedIcon sx={{ fontSize: 18 }} />}
                  onClick={() => setFullScreen(true)}
                  sx={{
                    minWidth: 0,
                    fontSize: '0.78rem',
                    textTransform: 'none',
                    fontWeight: 600,
                    color: '#2563EB',
                  }}
                >
                  Tela cheia
                </Button>
              </Stack>
            }
          >
            Código enviado
          </SectionTitle>

          <ReadOnlyCodeViewer code={submissao.codigoSubmetido} />
        </Card>

        {/* Coluna Direita: Status da Submissão e Resultados/Avisos */}
        <Stack spacing={2.5}>
          {/* Card: Status da submissão */}
          <Card variant="outlined" sx={cardStyle}>
            <SectionTitle icon={<CheckCircleRoundedIcon fontSize="small" />}>
              Status da submissão
            </SectionTitle>

            <Box sx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 1.75 }}>
              {/* Linha 1: Tipo de atividade */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: '#2563EB' }}>
                  <AssignmentOutlinedIcon sx={{ fontSize: 20 }} />
                  <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                    Tipo de atividade
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  {isProva ? 'Trabalho avaliativo' : 'Exercício de prática'}
                </Typography>
              </Box>

              <Divider sx={{ borderColor: '#F1F5F9' }} />

              {/* Linha 2: Situação */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: '#2563EB' }}>
                  <CheckCircleOutlinedIcon sx={{ fontSize: 20 }} />
                  <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                    Situação
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  {isRestrito ? 'Entregue' : isErroCompilacao ? 'Erro de compilação' : 'Avaliado'}
                </Typography>
              </Box>

              <Divider sx={{ borderColor: '#F1F5F9' }} />

              {/* Linha 3: Correção */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: '#2563EB' }}>
                  <DescriptionOutlinedIcon sx={{ fontSize: 20 }} />
                  <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                    Correção
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  {isRestrito ? 'Registrada' : isErroCompilacao ? 'Não executada' : 'Concluída'}
                </Typography>
              </Box>

              <Divider sx={{ borderColor: '#F1F5F9' }} />

              {/* Linha 4: Última atualização */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: '#2563EB' }}>
                  <AccessTimeOutlinedIcon sx={{ fontSize: 20 }} />
                  <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                    Última atualização
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  {formatSubmissionDate(submissao.dataAtualizacao || submissao.dataSubmissao)}
                </Typography>
              </Box>
            </Box>
          </Card>

          {/* ─── FLUXO A: Trabalho Avaliativo / Resultados Restritos (DESIGN DO MOCKUP) ─── */}
          {isRestrito && (
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                p: 2.5,
                bgcolor: '#FEF9ED',
                borderColor: '#FDE68A',
                boxShadow: 'none',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.75, mb: 2.5 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: '#FEF3C7',
                    color: '#B45309',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <LockRoundedIcon sx={{ fontSize: 22 }} />
                </Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: '#78350F',
                    fontSize: '0.92rem',
                    lineHeight: 1.45,
                    pt: 0.25,
                  }}
                >
                  Os resultados detalhados desta atividade não ficam disponíveis para o aluno neste momento.
                </Typography>
              </Box>

              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <CheckCircleRoundedIcon sx={{ color: '#16A34A', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600, fontSize: '0.85rem' }}>
                    Código enviado com sucesso
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <CheckCircleRoundedIcon sx={{ color: '#16A34A', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600, fontSize: '0.85rem' }}>
                    Tentativa registrada
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <LockRoundedIcon sx={{ color: '#475569', fontSize: 18 }} />
                  <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500, fontSize: '0.85rem' }}>
                    A visualização dos casos de teste e da nota está restrita
                  </Typography>
                </Box>
              </Stack>
            </Card>
          )}

          {/* ─── FLUXO B: Exercício / Resultados Liberados (Avaliado) ──────────── */}
          {!isRestrito && isAvaliada && (
            <>
              {/* Card de Notas e Casos Aprovados */}
              <Card variant="outlined" sx={cardStyle}>
                <SectionTitle icon={<CheckCircleRoundedIcon fontSize="small" />}>
                  Resultado da avaliação
                </SectionTitle>
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', mb: 1.5 }}>
                    <Box sx={{ pr: 1.5 }}>
                      <Typography sx={{ color: '#64748B', fontSize: '0.72rem', fontWeight: 600 }}>
                        Nota desta tentativa
                      </Typography>
                      <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                        {formatScore(submissao.nota, submissao.pontosTotal || submissao.notaMaxima)}
                      </Typography>
                    </Box>
                    <Box sx={{ pl: 1.5, borderLeft: '1px solid #E2E8F0' }}>
                      <Typography sx={{ color: '#64748B', fontSize: '0.72rem', fontWeight: 600 }}>
                        Casos aprovados
                      </Typography>
                      <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                        {total > 0 ? `${passed} / ${total}` : '—'}
                      </Typography>
                    </Box>
                  </Box>

                  {total > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={percentAprovado}
                        color="success"
                        sx={{ height: 8, borderRadius: 4, bgcolor: '#F1F5F9' }}
                      />
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', textAlign: 'right', mt: 0.5 }}>
                        {percentAprovado}% dos casos aprovados
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Card>

              {/* Card de Casos de Teste Visíveis */}
              <Card variant="outlined" sx={cardStyle}>
                <SectionTitle icon={<ScienceOutlinedIcon fontSize="small" />}>
                  Casos de teste visíveis
                </SectionTitle>
                <Box sx={{ p: 1.5, maxHeight: 380, overflowY: 'auto' }}>
                  {visibleCases.length > 0 ? (
                    visibleCases.map((testCase, index) => (
                      <VisibleTestCase
                        key={testCase.casoTesteAtividadeUuid || index}
                        testCase={testCase}
                        index={index}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 1, fontStyle: 'italic' }}>
                      Não há casos de teste públicos disponíveis para exibição direta.
                    </Typography>
                  )}
                </Box>
              </Card>
            </>
          )}

          {/* ─── FLUXO C: Erro de Compilação ──────────────────────────────────── */}
          {!isRestrito && isErroCompilacao && (
            <>
              <Card variant="outlined" sx={{ ...cardStyle, p: 2.5, borderColor: '#FDE68A', bgcolor: '#FEF9ED' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, color: '#D97706' }}>
                  <ErrorRoundedIcon sx={{ fontSize: 24, color: '#D97706' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#92400E' }}>
                    Falha na compilação do código
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#78350F', mb: 1.5, fontSize: '0.85rem' }}>
                  O compilador GCC encontrou erros de sintaxe ou declaração. Nenhum caso de teste foi executado.
                </Typography>
                {submissao.erroCompilacao && (
                  <Box
                    component="pre"
                    sx={{
                      p: 1.5,
                      bgcolor: '#1E293B',
                      color: '#F87171',
                      borderRadius: 2,
                      fontSize: '0.78rem',
                      fontFamily: 'monospace',
                      overflowX: 'auto',
                      m: 0,
                    }}
                  >
                    <code>{submissao.erroCompilacao}</code>
                  </Box>
                )}
              </Card>

              {visibleCases.length > 0 && (
                <Card variant="outlined" sx={cardStyle}>
                  <SectionTitle icon={<ScienceOutlinedIcon fontSize="small" />}>
                    Casos de teste visíveis
                  </SectionTitle>
                  <Box sx={{ p: 1.5, maxHeight: 380, overflowY: 'auto' }}>
                    {visibleCases.map((testCase, index) => (
                      <VisibleTestCase
                        key={testCase.casoTesteAtividadeUuid || index}
                        testCase={testCase}
                        index={index}
                        isNaoExecutado={true}
                        isErroCompilacao={true}
                      />
                    ))}
                  </Box>
                </Card>
              )}
            </>
          )}

          {/* ─── FLUXO D: Falha Técnica ────────────────────────────────────────── */}
          {!isRestrito && isFalhaTecnica && (
            <>
              <Alert severity="warning" sx={{ borderRadius: 2.5 }}>
                A correção não pôde ser processada devido a uma instabilidade no ambiente de execução. Esta tentativa não foi penalizada.
              </Alert>

              {visibleCases.length > 0 && (
                <Card variant="outlined" sx={cardStyle}>
                  <SectionTitle icon={<ScienceOutlinedIcon fontSize="small" />}>
                    Casos de teste visíveis
                  </SectionTitle>
                  <Box sx={{ p: 1.5, maxHeight: 380, overflowY: 'auto' }}>
                    {visibleCases.map((testCase, index) => (
                      <VisibleTestCase
                        key={testCase.casoTesteAtividadeUuid || index}
                        testCase={testCase}
                        index={index}
                        isNaoExecutado={true}
                        isErroCompilacao={false}
                      />
                    ))}
                  </Box>
                </Card>
              )}
            </>
          )}
        </Stack>
      </Box>

      {/* ─── Barra de Ações Inferior ───────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mt: 4,
          pt: 3,
          borderTop: '1px solid #E2E8F0',
        }}
      >
        <Button
          variant="contained"
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => navigate(backToActivityUrl)}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 2,
            px: 2.5,
            py: 1,
            bgcolor: '#2563EB',
            '&:hover': { bgcolor: '#1D4ED8' },
          }}
        >
          Voltar para a atividade
        </Button>

        <Button
          variant="outlined"
          startIcon={<HomeOutlinedIcon />}
          onClick={() => navigate('/aluno/atividades')}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 2,
            px: 2.5,
            py: 1,
            color: '#2563EB',
            borderColor: '#CBD5E1',
            '&:hover': { borderColor: '#2563EB', bgcolor: '#EFF6FF' },
          }}
        >
          Ir para minhas atividades
        </Button>
      </Box>

      {/* ─── Modal de Tela Cheia do Código ─────────────────────────────────── */}
      <Dialog open={fullScreen} onClose={() => setFullScreen(false)} fullScreen>
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            borderBottom: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
          }}
        >
          <CodeRoundedIcon sx={{ color: '#2563EB' }} />
          <Typography sx={{ fontWeight: 800, color: '#0F172A', flex: 1, fontSize: '1rem' }}>
            Código enviado · {submissao.funcaoNome}()
          </Typography>
          <IconButton aria-label="Fechar tela cheia" onClick={() => setFullScreen(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <ReadOnlyCodeViewer code={submissao.codigoSubmetido} fullScreen />
        </Box>
      </Dialog>
    </Box>
  );
}

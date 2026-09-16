/**
 * StudentSubmissionDetailPage — Visualização individual detalhada do resultado de uma submissão pelo aluno.
 *
 * Apresenta:
 * - Breadcrumb de navegação de volta para Minhas Submissões e para a Atividade.
 * - Cabeçalho com função, pontuação, data e status.
 * - Card de Resultado da Avaliação (casos de teste aprovados/reprovados, inputs/outputs respeitando ocultação).
 * - Feedback do Professor (se houver).
 * - Código C submetido com botão de cópia.
 * - Ação para tentar novamente / abrir editor da função.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Breadcrumbs,
  Card,
  CardContent,
  Chip,
  Button,
  Skeleton,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import CodeIcon from '@mui/icons-material/Code';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';

import { getSubmissao } from '../api';
import SubmissionResultCard from '../components/SubmissionResultCard';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', color: '#64748B', bg: '#F1F5F9', border: '#CBD5E1' },
  compilando: { label: 'Compilando', color: '#0284C7', bg: '#E0F2FE', border: '#BAE6FD' },
  executando: { label: 'Executando', color: '#0284C7', bg: '#E0F2FE', border: '#BAE6FD' },
  avaliado: { label: 'Avaliado', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  erro: { label: 'Erro', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
};

function formatDateTime(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function StudentSubmissionDetailPage() {
  const { uuid: submissaoUuid } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useSnackbar();

  const [submissao, setSubmissao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadDetail() {
      setLoading(true);
      try {
        const data = await getSubmissao(submissaoUuid);
        setSubmissao(data);
      } catch (err) {
        showError(err.response?.data?.detail || 'Erro ao carregar detalhes da submissão');
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [submissaoUuid, showError]);

  const handleCopyCode = () => {
    if (submissao?.codigoSubmetido) {
      navigator.clipboard.writeText(submissao.codigoSubmetido);
      setCopied(true);
      showSuccess('Código copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pb: 6 }}>
        <Skeleton variant="text" width={280} height={28} />
        <Skeleton variant="rounded" height={140} sx={{ borderRadius: 3 }} />
        <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  if (!submissao) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          Submissão não encontrada ou você não tem permissão para visualizá-la.
        </Alert>
        <Button variant="outlined" onClick={() => navigate('/aluno/submissoes')}>
          Voltar para Minhas Submissões
        </Button>
      </Box>
    );
  }

  const st = STATUS_CONFIG[submissao.status] || STATUS_CONFIG.pendente;
  const funcName = submissao.funcaoNome || 'funcao';
  const pontosTotal = submissao.pontosTotal ?? 10;
  const submitUrl = submissao.atividadeUuid
    ? `/aluno/atividades/${submissao.atividadeUuid}/funcao/${submissao.funcaoUuid}/submeter`
    : null;

  return (
    <Box className="fade-in" sx={{ pb: 6 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2.5 }}>
        <Link
          to="/aluno/submissoes"
          style={{ textDecoration: 'none', color: '#64748B', fontSize: '0.85rem' }}
        >
          Minhas submissões
        </Link>
        {submissao.atividadeUuid && (
          <Link
            to={`/aluno/atividades/${submissao.atividadeUuid}`}
            style={{ textDecoration: 'none', color: '#64748B', fontSize: '0.85rem' }}
          >
            {submissao.atividadeTitulo || 'Atividade'}
          </Link>
        )}
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', fontSize: '0.85rem' }}>
          Tentativa #{submissao.tentativaNumero}
        </Typography>
      </Breadcrumbs>

      {/* Header Principal */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tooltip title="Voltar para Minhas Submissões">
            <IconButton onClick={() => navigate('/aluno/submissoes')} sx={{ border: '1px solid #E2E8F0' }}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'monospace', color: '#0F172A' }}>
                {funcName}()
              </Typography>
              <Chip
                label={`Tentativa #${submissao.tentativaNumero}`}
                size="small"
                sx={{ fontWeight: 700, borderRadius: 1.5, backgroundColor: '#F1F5F9', color: '#475569' }}
              />
              <Chip
                label={st.label}
                size="small"
                sx={{
                  fontWeight: 700,
                  backgroundColor: st.bg,
                  color: st.color,
                  border: `1px solid ${st.border}`,
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {submissao.atividadeTitulo ? `${submissao.atividadeTitulo} · ` : ''}
              Enviado em {formatDateTime(submissao.dataSubmissao)}
            </Typography>
          </Box>
        </Box>

        {submitUrl && (
          <Button
            variant="contained"
            component={Link}
            to={submitUrl}
            startIcon={<PlayArrowIcon />}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              backgroundColor: '#4F46E5',
              borderRadius: 2,
              '&:hover': { backgroundColor: '#4338CA' },
            }}
          >
            Abrir no Editor / Nova Tentativa
          </Button>
        )}
      </Box>

      {/* Grid: Resultado e Código */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Card do Resultado da Avaliação */}
        {submissao.resultadoJson ? (
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 1 }}>
              Resultado dos Casos de Teste
            </Typography>
            <SubmissionResultCard
              resultado={submissao.resultadoJson}
              feedbackProfessor={submissao.feedbackProfessor}
            />
          </Box>
        ) : (
          <Card variant="outlined" sx={{ borderRadius: 3, p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Resultado detalhado não disponível para esta submissão.
            </Typography>
          </Card>
        )}

        {/* Código Submetido */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 1 }}>
              <CodeIcon fontSize="small" sx={{ color: '#4F46E5' }} />
              Código enviado nesta tentativa
            </Typography>
            <Button
              size="small"
              startIcon={copied ? <CheckIcon sx={{ color: '#10B981' }} /> : <ContentCopyIcon fontSize="small" />}
              onClick={handleCopyCode}
              sx={{ textTransform: 'none', fontSize: '0.8rem', color: '#4F46E5' }}
            >
              {copied ? 'Copiado!' : 'Copiar código'}
            </Button>
          </Box>

          <Card variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', backgroundColor: '#1E1E2E' }}>
            <Box
              component="pre"
              sx={{
                p: 2.5,
                m: 0,
                color: '#CDD6F4',
                fontFamily: "'Consolas', 'Courier New', monospace",
                fontSize: '0.875rem',
                lineHeight: 1.7,
                overflowX: 'auto',
              }}
            >
              <code>{submissao.codigoSubmetido || '// Nenhum código registrado'}</code>
            </Box>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}

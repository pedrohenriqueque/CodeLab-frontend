/**
 * SubmissionListPage — lista de submissões de uma função (professor).
 *
 * Rota: /atividades/:uuid/funcao/:funcaoUuid/submissoes
 *
 * Inclui nome do aluno na tabela e exibição do código submetido no dialog.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  TextField,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { getSubmissoes, getSubmissao, updateSubmissaoFeedback } from '../api';
import SubmissionResultCard from '../components/SubmissionResultCard';

const STATUS_CHIP = {
  pendente: { label: 'Pendente', color: 'default' },
  compilando: { label: 'Compilando', color: 'info' },
  executando: { label: 'Executando', color: 'info' },
  avaliado: { label: 'Avaliado', color: 'success' },
  erro: { label: 'Erro', color: 'error' },
};

function formatDate(isoString) {
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

export default function SubmissionListPage() {
  const { uuid: atividadeUuid, funcaoUuid } = useParams();
  const navigate = useNavigate();
  const [submissoes, setSubmissoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [savingFeedback, setSavingFeedback] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSubmissoes(funcaoUuid, null, atividadeUuid);
      setSubmissoes(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao carregar submissões');
    } finally {
      setLoading(false);
    }
  }, [funcaoUuid, atividadeUuid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewDetail = async (submissaoUuid) => {
    try {
      const detail = await getSubmissao(submissaoUuid);
      setSelectedDetail(detail);
      setFeedback(detail.feedbackProfessor || '');
      setDetailOpen(true);
    } catch {
      // fallback: mostrar o que já temos
      const sub = submissoes.find((s) => s.uuid === submissaoUuid);
      if (sub) {
        setSelectedDetail(sub);
        setFeedback(sub.feedbackProfessor || '');
        setDetailOpen(true);
      }
    }
  };

  const handleSaveFeedback = async () => {
    if (!selectedDetail) return;
    setSavingFeedback(true);
    try {
      const updated = await updateSubmissaoFeedback(selectedDetail.uuid, feedback);
      setSelectedDetail(updated);
      setSubmissoes(prev => prev.map(s => s.uuid === updated.uuid ? updated : s));
    } catch (err) {
      console.error(err);
    } finally {
      setSavingFeedback(false);
    }
  };

  return (
    <Box className="fade-in">
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          underline="hover"
          color="inherit"
          sx={{ cursor: 'pointer', fontSize: '0.875rem' }}
          onClick={() => navigate('/atividades')}
        >
          Atividades
        </Link>
        <Link
          underline="hover"
          color="inherit"
          sx={{ cursor: 'pointer', fontSize: '0.875rem' }}
          onClick={() => navigate(`/atividades/${atividadeUuid}`)}
        >
          Detalhes
        </Link>
        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
          Submissões
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Tooltip title="Voltar">
          <IconButton onClick={() => navigate(`/atividades/${atividadeUuid}`)}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h5">Submissões</Typography>
        <Chip label={`${submissoes.length} total`} size="small" variant="outlined" />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={56} sx={{ mb: 1, borderRadius: 2 }} />
          ))}
        </Box>
      ) : submissoes.length === 0 ? (
        <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
          Nenhuma submissão encontrada para esta função.
        </Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Aluno</TableCell>
                <TableCell>Data</TableCell>
                <TableCell>Tentativa</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Nota</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submissoes.map((sub) => {
                const status = STATUS_CHIP[sub.status] || STATUS_CHIP.pendente;
                return (
                  <TableRow key={sub.uuid} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {sub.alunoNome || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(sub.dataSubmissao)}</TableCell>
                    <TableCell>
                      <Chip label={`#${sub.tentativaNumero}`} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip label={status.label} color={status.color} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: sub.nota != null && sub.nota > 0 ? 'success.main' : 'text.secondary',
                        }}
                      >
                        {sub.nota != null ? sub.nota : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ver detalhes">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewDetail(sub.uuid)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Detalhes da Submissão
          {selectedDetail?.alunoNome && (
            <Typography variant="body2" color="text.secondary">
              Aluno: {selectedDetail.alunoNome}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {/* Resultado da avaliação */}
          {selectedDetail?.resultadoJson ? (
            <SubmissionResultCard
              resultado={selectedDetail.resultadoJson}
              feedbackProfessor={selectedDetail.feedbackProfessor}
            />
          ) : (
            <Typography color="text.secondary">Sem resultados disponíveis.</Typography>
          )}

          {/* Código submetido */}
          {selectedDetail?.codigoSubmetido && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Código Submetido
              </Typography>
              <Box
                component="pre"
                sx={{
                  backgroundColor: '#1e1e2e',
                  color: '#cdd6f4',
                  p: 2,
                  borderRadius: 2,
                  overflow: 'auto',
                  maxHeight: 400,
                  fontSize: '0.8rem',
                  lineHeight: 1.6,
                  fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", monospace',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&::-webkit-scrollbar': {
                    width: 6,
                    height: 6,
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: 3,
                  },
                }}
              >
                <code>{selectedDetail.codigoSubmetido}</code>
              </Box>
            </>
          )}

          {/* Feedback Section */}
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Feedback do Professor
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Escreva um feedback para o aluno..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveFeedback}
              disabled={savingFeedback}
              startIcon={savingFeedback && <CircularProgress size={16} />}
            >
              Salvar Feedback
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

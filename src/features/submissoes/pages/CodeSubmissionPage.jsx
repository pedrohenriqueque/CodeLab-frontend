/**
 * CodeSubmissionPage — tela de submissão de código do aluno.
 *
 * Layout em duas colunas:
 *   Esquerda: editor de código (textarea)
 *   Direita: painel de feedback (resultado)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  FormControlLabel,
  Card,
  CardContent,
  Breadcrumbs,
  Link,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CodeIcon from '@mui/icons-material/Code';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

import { getFuncao, getAtividade } from '../../atividades/api';
import { createSubmissao } from '../api';
import SubmissionResultCard from '../components/SubmissionResultCard';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';
import useProgresso from '../../atividades/hooks/useProgresso';

const DIFICULDADE_COLORS = {
  facil: 'success',
  medio: 'warning',
  dificil: 'error',
};

const DIFICULDADE_LABELS = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
};

export default function CodeSubmissionPage() {
  const { uuid: atividadeUuid, funcaoUuid } = useParams();
  const navigate = useNavigate();
  const { showError } = useSnackbar();

  const [funcao, setFuncao] = useState(null);
  const [atividade, setAtividade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [codigo, setCodigo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [mostrarCasosTeste, setMostrarCasosTeste] = useState(false);
  
  const { progresso, refetch: refetchProgresso } = useProgresso();
  const funcProg = progresso.find(p => p.funcaoUuid === funcaoUuid);
  const tentativasUsadas = funcProg?.tentativasUsadas || 0;

  // Buscar detalhes da função
  useEffect(() => {
    async function fetch() {
      try {
        const [funcaoData, atividadeData] = await Promise.all([
          getFuncao(funcaoUuid),
          getAtividade(atividadeUuid)
        ]);
        setFuncao(funcaoData);
        setAtividade(atividadeData);
        // Gerar template do código
        const params = (funcaoData.parametros || [])
          .map((p) => `${p.tipo} ${p.nome}`)
          .join(', ');
        const ret = funcaoData.retorno?.tipo || 'int';
        setCodigo(`${ret} ${funcaoData.nomeFuncao}(${params}) {\n    // Seu código aqui\n    \n}`);
      } catch (err) {
        showError('Erro ao carregar os dados');
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [funcaoUuid, atividadeUuid, showError]);

  const handleSubmit = async () => {
    if (!codigo.trim()) return;
    setSubmitting(true);
    setResultado(null);
    try {
      const res = await createSubmissao(funcaoUuid, codigo);
      setResultado(res);
      refetchProgresso();
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.detail?.includes('única tentativa')) {
         showError('Você já utilizou sua tentativa para esta prova.');
      } else {
         showError(err.response?.data?.detail || 'Erro ao submeter código');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    if (funcao) {
      const params = (funcao.parametros || [])
        .map((p) => `${p.tipo} ${p.nome}`)
        .join(', ');
      const ret = funcao.retorno?.tipo || 'int';
      setCodigo(`${ret} ${funcao.nomeFuncao}(${params}) {\n    // Seu código aqui\n    \n}`);
    }
    setResultado(null);
  };

  const handlePaste = (e) => {
    if (atividade?.bloquearPaste) {
      e.preventDefault();
      showError('Copiar e colar está desativado para esta atividade (Modo Prova).');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Skeleton variant="text" width={300} height={32} />
        <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  const isFechada = atividade?.status === 'fechado' || (atividade?.dataFechamento && new Date(atividade.dataFechamento) < new Date());

  return (
    <Box className="fade-in">
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          underline="hover"
          color="inherit"
          sx={{ cursor: 'pointer', fontSize: '0.875rem' }}
          onClick={() => navigate('/aluno/atividades')}
        >
          Atividades
        </Link>
        <Link
          underline="hover"
          color="inherit"
          sx={{ cursor: 'pointer', fontSize: '0.875rem' }}
          onClick={() => navigate(`/aluno/atividades/${atividadeUuid}`)}
        >
          Detalhes
        </Link>
        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
          {funcao?.nomeFuncao || 'Submeter'}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Tooltip title="Voltar">
          <IconButton onClick={() => navigate(`/aluno/atividades/${atividadeUuid}`)}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <CodeIcon color="primary" sx={{ fontSize: 28 }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" sx={{ fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 1 }}>
            {funcao?.nomeFuncao}()
            {funcao?.dificuldade && (
              <Chip 
                label={DIFICULDADE_LABELS[funcao.dificuldade] || 'Médio'} 
                size="small" 
                color={DIFICULDADE_COLORS[funcao.dificuldade] || 'warning'} 
                sx={{ ml: 1, fontFamily: 'sans-serif' }}
              />
            )}
          </Typography>
        </Box>
        {funcao?.pontos && (
          <Chip label={`${funcao.pontos} pts`} color="primary" variant="outlined" sx={{ ml: 'auto' }} />
        )}
      </Box>

      {/* Painel de Enunciado Rico */}
      {funcao && (
        <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1.5 }}>Enunciado</Typography>
            
            {funcao.descricao && (
              <Typography variant="body1" sx={{ mb: 3 }}>
                {funcao.descricao}
              </Typography>
            )}

            {funcao.maxTentativas && (
              <Alert severity="info" sx={{ mb: 3, display: 'inline-flex' }}>
                Tentativas: {tentativasUsadas} de {funcao.maxTentativas}
              </Alert>
            )}

            {atividade?.tipo === 'exercicio' && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Casos de teste</Typography>
                  <FormControlLabel
                    sx={{ mr: 0 }}
                    control={(
                      <Switch
                        size="small"
                        checked={mostrarCasosTeste}
                        onChange={(e) => setMostrarCasosTeste(e.target.checked)}
                      />
                    )}
                    label="Exibir"
                  />
                </Box>
                {mostrarCasosTeste ? (
                  funcao.casosTeste && funcao.casosTeste.length > 0 ? (
                    <Paper variant="outlined" sx={{ overflow: 'hidden', mb: 3 }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: 'action.hover' }}>
                          <TableRow>
                            <TableCell>Entrada</TableCell>
                            <TableCell>Saída Esperada</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {funcao.casosTeste.slice(0, 2).map((caso) => (
                            <TableRow key={caso.uuid}>
                              <TableCell sx={{ fontFamily: 'monospace' }}>
                                {Object.entries(caso.inputs).map(([k, v]) => `${k} = ${JSON.stringify(v)}`).join(', ')}
                              </TableCell>
                              <TableCell sx={{ fontFamily: 'monospace' }}>
                                {JSON.stringify(caso.outputEsperado?.retorno ?? caso.outputEsperado)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Paper>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Nenhum caso de teste disponível.</Typography>
                  )
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Ative "Exibir" para visualizar os casos de teste deste exercício.
                  </Typography>
                )}
              </>
            )}

            {/* Dicas Progressivas */}
            {funcao.dicas && funcao.dicas.length > 0 && funcao.dicas.some(d => d) && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LightbulbIcon fontSize="small" color="warning" />
                  Dicas
                </Typography>
                {funcao.dicas.map((dica, index) => {
                  if (!dica) return null;
                  const tentativasNecessarias = index + 1;
                  const bloqueada = tentativasUsadas < tentativasNecessarias;
                  
                  return (
                    <Accordion key={index} disabled={bloqueada} sx={{ mb: 1, '&:before': { display: 'none' }, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="body2" sx={{ color: bloqueada ? 'text.disabled' : 'text.primary' }}>
                          Dica {index + 1} {bloqueada ? `(Desbloqueia após ${tentativasNecessarias} erro${tentativasNecessarias > 1 ? 's' : ''})` : ''}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" color="text.secondary">{dica}</Typography>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      <Divider sx={{ mb: 3 }} />

      {isFechada && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Esta atividade está encerrada. Você pode visualizar o código e os resultados anteriores, mas o envio de novas submissões está desabilitado.
        </Alert>
      )}

      {/* Layout em 2 colunas */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        {/* Coluna esquerda: Editor */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Seu Código C
          </Typography>
          <Card variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box
              component="textarea"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onPaste={handlePaste}
              spellCheck={false}
              sx={{
                width: '100%',
                minHeight: 350,
                p: 2,
                border: 'none',
                outline: 'none',
                fontFamily: "'Consolas', 'Courier New', monospace",
                fontSize: '0.875rem',
                lineHeight: 1.7,
                backgroundColor: '#1E1E2E',
                color: '#CDD6F4',
                resize: 'vertical',
                tabSize: 4,
              }}
            />
          </Card>

          {/* Botões */}
          <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
            <Button
              id="btn-submeter-codigo"
              variant="contained"
              size="large"
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
              onClick={handleSubmit}
              disabled={submitting || !codigo.trim() || isFechada}
              sx={{ flex: 1, py: 1.3 }}
            >
              {submitting ? 'Enviando...' : 'Enviar Código'}
            </Button>
            <Button
              variant="text"
              startIcon={<RestartAltIcon />}
              onClick={handleClear}
              disabled={submitting}
            >
              Limpar
            </Button>
          </Box>
        </Box>

        {/* Coluna direita: Feedback */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Resultado
          </Typography>

          {submitting ? (
            <Card>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 2 }}>
                <CircularProgress size={40} />
                <Typography variant="body2" color="text.secondary">
                  Compilando e executando seu código...
                </Typography>
              </CardContent>
            </Card>
          ) : resultado ? (
            atividade?.tipo === 'prova' && !atividade?.notasLiberadas ? (
              <Card>
                <CardContent sx={{ py: 6, textAlign: 'center' }}>
                  <Alert severity="success" variant="outlined" sx={{ mb: 2, justifyContent: 'center' }}>
                    Submissão enviada com sucesso!
                  </Alert>
                  <Typography variant="body1" color="text.secondary">
                    Como esta atividade é uma prova, o feedback e a nota estão ocultos no momento.
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Aguarde o professor liberar as notas.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <SubmissionResultCard resultado={resultado} />
            )
          ) : (
            <Card>
              <CardContent sx={{ py: 6, textAlign: 'center' }}>
                <CodeIcon sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
                <Typography variant="body1" color="text.secondary">
                  Escreva seu código e clique em "Enviar Código" para validar.
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Seu código será compilado e testado automaticamente.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
}

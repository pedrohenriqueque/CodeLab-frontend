/**
 * CodeSubmissionPage — tela de resolução e submissão de código de uma função (Aluno).
 *
 * Funcionalidades:
 *   - Enunciado da função no contexto da atividade (dificuldade, peso, casos configurados).
 *   - Editor de código C.
 *   - Envio de tentativa contextual: { atividadeUuid, funcaoUuid, codigo }.
 *   - Painel de feedback com resultado da avaliação e mascaramento estrito de casos ocultos.
 *   - Histórico isolado de tentativas para esta função específica nesta atividade.
 *   - Bloqueio quando a atividade já foi entregue (RN14) ou quando o prazo expirou.
 */

import { useState, useEffect, useCallback } from 'react';
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
import HistoryIcon from '@mui/icons-material/History';
import RestoreIcon from '@mui/icons-material/Restore';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import { getFuncao, getAtividade } from '../../atividades/api';
import { createSubmissao, getSubmissoes } from '../api';
import SubmissionResultCard from '../components/SubmissionResultCard';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';
import useProgresso from '../../atividades/hooks/useProgresso';
import { useAuth } from '../../auth/hooks/useAuthProvider';

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

function formatTimestamp(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CodeSubmissionPage() {
  const { uuid: atividadeUuid, funcaoUuid } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useSnackbar();
  const { user } = useAuth();

  const [funcao, setFuncao] = useState(null);
  const [atividade, setAtividade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [codigo, setCodigo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [mostrarCasosTeste, setMostrarCasosTeste] = useState(false);
  const [historicoTentativas, setHistoricoTentativas] = useState([]);

  const { progresso, refetch: refetchProgresso } = useProgresso(user?.uuid);
  const funcProg = progresso.find(p => p.funcaoUuid === funcaoUuid);
  const tentativasUsadas = funcProg?.tentativasUsadas || 0;

  // Carregar histórico de tentativas desta função nesta atividade
  const fetchHistorico = useCallback(async () => {
    if (!funcaoUuid) return;
    try {
      const subs = await getSubmissoes(funcaoUuid, null, atividadeUuid);
      setHistoricoTentativas(Array.isArray(subs) ? subs : []);
    } catch {
      setHistoricoTentativas([]);
    }
  }, [funcaoUuid, atividadeUuid]);

  // Buscar detalhes da função e da atividade
  useEffect(() => {
    async function fetchData() {
      try {
        let funcaoData = null;
        let atividadeData = null;

        if (atividadeUuid) {
          atividadeData = await getAtividade(atividadeUuid);
          setAtividade(atividadeData);

          // Obtém os dados contextuais da função diretamente da atividade
          const found = (atividadeData?.funcoes || []).find(
            (f) => (f.funcaoUuid || f.uuid) === funcaoUuid
          );
          if (found) {
            funcaoData = found;
          }
        }

        // Fallback apenas se não foi encontrada dentro da atividade
        if (!funcaoData) {
          funcaoData = await getFuncao(funcaoUuid);
        }

        setFuncao(funcaoData);

        // Gerar template do código
        const params = (funcaoData.parametros || [])
          .map((p) => `${p.tipo} ${p.nome}`)
          .join(', ');
        const ret = funcaoData.retorno?.tipo || funcaoData.retorno || 'int';
        setCodigo(`${ret} ${funcaoData.nomeFuncao}(${params}) {\n    // Seu código aqui\n    \n}`);
      } catch {
        showError('Erro ao carregar dados da função ou da atividade');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    fetchHistorico();
  }, [funcaoUuid, atividadeUuid, showError, fetchHistorico]);

  // Contextual attributes
  const af = atividade?.funcoes?.find(f => (f.funcaoUuid || f.uuid) === funcaoUuid);
  const pontosMax = af?.peso ?? funcao?.pontos ?? 10;
  const dificuldade = af?.dificuldade ?? funcao?.dificuldadePadrao ?? funcao?.dificuldade ?? 'medio';
  const casosTeste = af?.casosTeste || funcao?.casosTeste || [];

  const isFechada =
    atividade?.status === 'fechado' ||
    (atividade?.dataFechamento && new Date(atividade.dataFechamento) < new Date());

  const isEntregue = atividade?.statusEntrega === 'entregue';

  const handleSubmit = async () => {
    if (!codigo.trim()) return;
    setSubmitting(true);
    setResultado(null);
    try {
      const res = await createSubmissao(funcaoUuid, codigo, atividadeUuid);
      setResultado(res);
      showSuccess('Submissão avaliada com sucesso!');
      refetchProgresso();
      fetchHistorico();
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.detail?.includes('já entregue')) {
        showError('Esta atividade já foi entregue. Novas submissões não são permitidas.');
      } else if (err.response?.status === 400 && err.response?.data?.detail?.includes('única tentativa')) {
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
      const ret = funcao.retorno?.tipo || funcao.retorno || 'int';
      setCodigo(`${ret} ${funcao.nomeFuncao}(${params}) {\n    // Seu código aqui\n    \n}`);
    }
    setResultado(null);
  };

  const handleRestaurarCodigo = (codSubmetido) => {
    if (codSubmetido) {
      setCodigo(codSubmetido);
      showSuccess('Código da tentativa restaurado no editor!');
    }
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
          {atividade?.titulo || 'Detalhes'}
        </Link>
        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
          {funcao?.nomeFuncao || 'Submeter'}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tooltip title="Voltar para a atividade">
            <IconButton onClick={() => navigate(`/aluno/atividades/${atividadeUuid}`)}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <CodeIcon color="primary" sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h5" sx={{ fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 1 }}>
              {funcao?.nomeFuncao}()
              <Chip
                label={DIFICULDADE_LABELS[dificuldade] || 'Médio'}
                size="small"
                color={DIFICULDADE_COLORS[dificuldade] || 'warning'}
                sx={{ fontFamily: 'sans-serif' }}
              />
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chip
            label={`${pontosMax.toFixed(1)} pts`}
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate(`/aluno/atividades/${atividadeUuid}`)}
            sx={{ textTransform: 'none' }}
          >
            ← Voltar para Atividade
          </Button>
        </Box>
      </Box>

      {/* Alerta de Atividade Entregue */}
      {isEntregue && (
        <Alert severity="success" icon={<TaskAltIcon />} sx={{ mb: 3, borderRadius: 2 }}>
          Esta atividade já foi <strong>entregue</strong> por você. O envio de novas tentativas está encerrado, mas você pode visualizar seus códigos e resultados.
        </Alert>
      )}

      {/* Alerta de Prazo Encerrado */}
      {isFechada && !isEntregue && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          O prazo para entrega desta atividade encerrou. O envio de novas submissões está desabilitado.
        </Alert>
      )}

      {/* Painel de Enunciado da Função */}
      {funcao && (
        <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>
              Enunciado
            </Typography>

            {funcao.descricao && (
              <Typography variant="body1" sx={{ mb: 2 }}>
                {funcao.descricao}
              </Typography>
            )}

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <Chip
                label={`Tentativas realizadas: ${tentativasUsadas}`}
                size="small"
                variant="outlined"
              />
              {funcProg?.melhorNota !== undefined && (
                <Chip
                  label={`Melhor nota: ${funcProg.melhorNota.toFixed(1)} / ${pontosMax.toFixed(1)} pts`}
                  size="small"
                  color={funcProg.melhorNota >= pontosMax ? 'success' : 'primary'}
                  variant="outlined"
                />
              )}
            </Box>

            {/* Casos de Teste (respeitando casos ocultos) */}
            {atividade?.tipo === 'exercicio' && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Casos de Teste Configurados ({casosTeste.length})
                  </Typography>
                  <FormControlLabel
                    sx={{ mr: 0 }}
                    control={
                      <Switch
                        size="small"
                        checked={mostrarCasosTeste}
                        onChange={(e) => setMostrarCasosTeste(e.target.checked)}
                      />
                    }
                    label="Exibir exemplos"
                  />
                </Box>
                {mostrarCasosTeste && (
                  casosTeste.length > 0 ? (
                    <Paper variant="outlined" sx={{ overflow: 'hidden', mb: 2 }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: 'action.hover' }}>
                          <TableRow>
                            <TableCell sx={{ width: 60 }}>#</TableCell>
                            <TableCell>Entrada</TableCell>
                            <TableCell>Saída Esperada</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {casosTeste.map((caso, index) => {
                            const isOculto = caso.oculto || caso.inputs === null;
                            return (
                              <TableRow key={caso.uuid || caso.casoTesteUuid || index}>
                                <TableCell sx={{ fontWeight: 600 }}>#{caso.numero || index + 1}</TableCell>
                                {isOculto ? (
                                  <TableCell colSpan={2} sx={{ color: 'text.secondary' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <VisibilityOffIcon fontSize="small" />
                                      <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                                        Caso de teste oculto (executado na avaliação da submissão)
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                ) : (
                                  <>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>
                                      {typeof caso.inputs === 'object'
                                        ? Object.entries(caso.inputs || {}).map(([k, v]) => `${k} = ${JSON.stringify(v)}`).join(', ')
                                        : JSON.stringify(caso.inputs)}
                                    </TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>
                                      {JSON.stringify(caso.outputEsperado?.retorno ?? caso.outputEsperado?.valor ?? caso.outputEsperado)}
                                    </TableCell>
                                  </>
                                )}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </Paper>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Nenhum caso de teste disponível.
                    </Typography>
                  )
                )}
              </>
            )}

            {/* Dicas */}
            {funcao.dicas && funcao.dicas.length > 0 && funcao.dicas.some((d) => d) && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LightbulbIcon fontSize="small" color="warning" />
                  Dicas pedagógicas
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

      {/* Layout Principal: Editor + Resultado */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          alignItems: 'start',
          mb: 4,
        }}
      >
        {/* Coluna esquerda: Editor de Código */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Implementação da Função {funcao?.nomeFuncao}()
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Escreva apenas a função requisitada em C
            </Typography>
          </Box>

          <Card variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box
              component="textarea"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onPaste={handlePaste}
              disabled={isEntregue || isFechada}
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
                opacity: isEntregue || isFechada ? 0.7 : 1,
              }}
            />
          </Card>

          {/* Botões de Ação */}
          <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
            <Button
              id="btn-submeter-codigo"
              variant="contained"
              size="large"
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
              onClick={handleSubmit}
              disabled={submitting || !codigo.trim() || isFechada || isEntregue}
              sx={{ flex: 1, py: 1.3 }}
            >
              {submitting ? 'Avaliando no Judge0...' : 'Enviar Tentativa'}
            </Button>
            <Button
              variant="text"
              startIcon={<RestartAltIcon />}
              onClick={handleClear}
              disabled={submitting || isEntregue || isFechada}
            >
              Restaurar Template
            </Button>
          </Box>
        </Box>

        {/* Coluna direita: Painel de Feedback */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Resultado da Tentativa
          </Typography>

          {submitting ? (
            <Card>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 2 }}>
                <CircularProgress size={40} />
                <Typography variant="body2" color="text.secondary">
                  Compilando e executando seu código contra os casos de teste...
                </Typography>
              </CardContent>
            </Card>
          ) : resultado ? (
            atividade?.tipo === 'prova' && !atividade?.notasLiberadas ? (
              <Card>
                <CardContent sx={{ py: 6, textAlign: 'center' }}>
                  <Alert severity="success" variant="outlined" sx={{ mb: 2, justifyContent: 'center' }}>
                    Tentativa enviada com sucesso!
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
                  Escreva seu código e clique em "Enviar Tentativa" para validar.
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Cada envio gera uma tentativa individual para esta função.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>

      {/* Histórico Isolado de Tentativas Desta Função (Item 6, 8 e 14) */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <HistoryIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
            Histórico de Tentativas desta Função ({historicoTentativas.length})
          </Typography>
        </Box>

        {historicoTentativas.length === 0 ? (
          <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
            Você ainda não enviou tentativas para esta função.
          </Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ width: 80 }}>Tentativa</TableCell>
                  <TableCell>Data/Hora</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Nota Obtida</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historicoTentativas.map((sub, idx) => {
                  const numTentativa = sub.tentativaNumero || historicoTentativas.length - idx;
                  const isNotaMax = sub.nota !== null && sub.nota >= pontosMax;
                  return (
                    <TableRow key={sub.uuid || idx}>
                      <TableCell sx={{ fontWeight: 600 }}>#{numTentativa}</TableCell>
                      <TableCell>{formatTimestamp(sub.dataSubmissao)}</TableCell>
                      <TableCell>
                        <Chip
                          label={sub.status}
                          size="small"
                          color={sub.status === 'avaliado' ? 'success' : 'error'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: isNotaMax ? 'success.main' : 'text.primary' }}>
                        {sub.nota !== null && sub.nota !== undefined ? `${sub.nota.toFixed(1)} pts` : '—'}
                      </TableCell>
                      <TableCell align="right">
                        {sub.codigoSubmetido && (
                          <Tooltip title="Carregar este código no editor">
                            <Button
                              size="small"
                              variant="text"
                              startIcon={<RestoreIcon />}
                              onClick={() => handleRestaurarCodigo(sub.codigoSubmetido)}
                              sx={{ textTransform: 'none' }}
                            >
                              Carregar Código
                            </Button>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
}

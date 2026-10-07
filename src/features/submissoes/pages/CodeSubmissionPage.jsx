/**
 * CodeSubmissionPage — Tela de resolução e submissão de código de uma função (Aluno).
 *
 * Implementa o fluxo visual do aluno conforme o mockup oficial:
 *   - Estado inicial (0 tentativas): Orientações pedagógicas, tabela de casos visíveis,
 *     editor com gutter de linhas, alerta de histórico vazio.
 *   - Estado avaliado (com tentativas): Painel de resultado da tentativa com notas e casos,
 *     casos de teste em acordeom com status Aprovado/Reprovado (Entrada, Esperado, Obtido),
 *     histórico completo com ação "Ver detalhes" e restauração de código.
 *   - Preserva todos os fluxos críticos de negócio:
 *     * Modo Prova (tentativa única, bloqueio de paste, feedback oculto até encerramento).
 *     * Atividade fechada/expirada (bloqueio de novas submissões).
 *     * Dicas pedagógicas progressivas desbloqueadas por tentativas.
 *     * Mascaramento estrito de casos de teste ocultos.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Breadcrumbs,
  Link,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Chip,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  Select,
  MenuItem,
  LinearProgress,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CodeIcon from '@mui/icons-material/Code';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ScienceIcon from '@mui/icons-material/Science';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SettingsIcon from '@mui/icons-material/Settings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RestoreIcon from '@mui/icons-material/Restore';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import CloseIcon from '@mui/icons-material/Close';
import BarChartIcon from '@mui/icons-material/BarChart';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';

import { getFuncao, getAtividade, getFuncoesAtividade } from '../../atividades/api';
import { createSubmissao, getSubmissoes } from '../api';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';
import TestCaseInputs from '../../../shared/components/TestCaseInputs';
import NoVisibleTestCasesNotice from '../../../shared/components/NoVisibleTestCasesNotice';
import { formatCapturedReturn, formatTestCaseValue } from '../../../shared/components/testCaseValues';

// ─── Helpers de Formatação ──────────────────────────────────────────────────

const DIFICULDADE_CONFIG = {
  facil: { label: 'Fácil', bg: '#22c55e', text: '#ffffff' },
  medio: { label: 'Médio', bg: '#f97316', text: '#ffffff' },
  dificil: { label: 'Difícil', bg: '#ef4444', text: '#ffffff' },
};

function formatScoreDisplay(score, maxScore) {
  if (score === null || score === undefined) return '—';
  const scoreNum = Number(score);
  const scoreFormatted = Number.isInteger(scoreNum)
    ? scoreNum.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    : scoreNum.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });

  if (maxScore !== null && maxScore !== undefined) {
    const maxNum = Number(maxScore);
    const maxFormatted = Number.isInteger(maxNum)
      ? maxNum.toString()
      : maxNum.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return `${scoreFormatted} / ${maxFormatted}`;
  }
  return scoreFormatted;
}

function formatPoints(pts) {
  if (pts === null || pts === undefined) return '0,0 pts';
  const val = Number(pts);
  const formatted = val.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `${formatted} pts`;
}

function formatTimestamp(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${day}/${month}/${year}, ${hours}:${minutes}`;
}

function cType(type) {
  return type === 'string' ? 'const char *' : type;
}

function formatCParameter(parameter) {
  const type = parameter.tipo || 'int';
  const name = parameter.nome || 'valor';
  if (type.endsWith('[]')) return `${cType(type.slice(0, -2))} ${name}[]`;
  return `${cType(type)} ${name}`;
}

function generateInitialTemplate(funcao) {
  if (!funcao) return 'int maiorElemento(int valores[], int tamanho) {\n    // Seu código aqui\n    \n}';
  if (funcao.templateCodigo || funcao.codigoTemplate) {
    return funcao.templateCodigo || funcao.codigoTemplate;
  }
  const ret = cType(funcao.tipoRetorno || funcao.tipo_retorno || 'int');
  const nome = funcao.nome || funcao.nomeFuncao || funcao.nome_funcao || 'funcao';
  const parametros = (funcao.parametros || []).map(formatCParameter);
  return `${ret} ${nome}(${parametros.length ? parametros.join(', ') : 'void'}) {\n    // Seu código aqui\n    \n}`;
}

// ─── Componente do Editor com Gutter de Linhas ──────────────────────────────

function CodeEditor({ value, onChange, onPaste, disabled }) {
  const textareaRef = useRef(null);
  const gutterRef = useRef(null);

  const lines = value.split('\n');
  const lineCount = Math.max(lines.length, 5);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newValue = value.substring(0, start) + '    ' + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        borderRadius: 2,
        overflow: 'hidden',
        backgroundColor: '#1E222D',
        border: '1px solid #2D333B',
        minHeight: 330,
        opacity: disabled ? 0.75 : 1,
      }}
    >
      {/* Coluna de números de linha (Gutter) */}
      <Box
        ref={gutterRef}
        sx={{
          width: 44,
          flexShrink: 0,
          backgroundColor: '#181B22',
          borderRight: '1px solid #282F3D',
          color: '#64748B',
          py: 2,
          px: 1,
          textAlign: 'right',
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
          fontSize: '0.85rem',
          lineHeight: '1.65rem',
          userSelect: 'none',
          overflow: 'hidden',
        }}
      >
        {lineNumbers.map((num) => (
          <div key={num}>{num}</div>
        ))}
      </Box>

      {/* Área de edição */}
      <Box
        component="textarea"
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        onPaste={onPaste}
        disabled={disabled}
        spellCheck={false}
        sx={{
          flex: 1,
          width: '100%',
          minHeight: 330,
          p: 2,
          border: 'none',
          outline: 'none',
          backgroundColor: 'transparent',
          color: '#E2E8F0',
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Courier New', monospace",
          fontSize: '0.875rem',
          lineHeight: '1.65rem',
          resize: 'vertical',
          whiteSpace: 'pre',
          overflowX: 'auto',
          tabSize: 4,
          '&:focus': {
            outline: 'none',
          },
        }}
      />
    </Box>
  );
}

// ─── Modal de Detalhes da Tentativa ─────────────────────────────────────────

function DetalhesTentativaDialog({ open, onClose, tentativa, onRestaurarCodigo }) {
  const [copiado, setCopiado] = useState(false);
  const { showSuccess } = useSnackbar();

  if (!tentativa) return null;

  const handleCopy = () => {
    if (tentativa.codigoSubmetido) {
      navigator.clipboard.writeText(tentativa.codigoSubmetido);
      setCopiado(true);
      showSuccess('Código copiado com sucesso!');
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const isErroCompilacao = tentativa.status === 'ERRO_COMPILACAO';
  const isAvaliada = tentativa.status === 'AVALIADA' || tentativa.status === 'avaliado';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Tentativa #{tentativa.tentativaNumero}
          </Typography>
          {isAvaliada && (
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: '16px !important', color: '#15803d !important' }} />}
              label="Avaliada"
              size="small"
              sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 600, borderRadius: 1.5 }}
            />
          )}
          {isErroCompilacao && (
            <Chip
              icon={<CancelIcon sx={{ fontSize: '16px !important', color: '#b91c1c !important' }} />}
              label="Erro de compilação"
              size="small"
              sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 600, borderRadius: 1.5 }}
            />
          )}
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 2.5 }}>
        {/* Metadados */}
        <Box sx={{ display: 'flex', gap: 4, mb: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Enviada em
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatTimestamp(tentativa.dataSubmissao)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Nota obtida
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: isErroCompilacao ? 'text.secondary' : '#0284c7' }}>
              {formatScoreDisplay(tentativa.nota, tentativa.notaMaxima || tentativa.pontosTotal)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Casos aprovados
            </Typography>
            {isErroCompilacao || tentativa.falhaTecnica ? (
              <Tooltip title={isErroCompilacao ? "Casos de teste não executados por erro de compilação no GCC." : "Casos de teste não avaliados por falha técnica."} arrow>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  Não executados
                </Typography>
              </Tooltip>
            ) : (
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {tentativa.totalCasos ? `${tentativa.casosAprovados} / ${tentativa.totalCasos}` : '—'}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Mensagem de Erro de Compilação se houver */}
        {isErroCompilacao && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Falha na Compilação (GCC)
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
              {tentativa.erroCompilacao || 'O código enviado não compilou com o GCC. Verifique tipos e pontuação.'}
            </Typography>
          </Alert>
        )}

        {/* Código submetido */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              Código enviado nesta tentativa:
            </Typography>
            <Button
              size="small"
              startIcon={<ContentCopyIcon fontSize="small" />}
              onClick={handleCopy}
              sx={{ textTransform: 'none', fontSize: '0.8rem' }}
            >
              {copiado ? 'Copiado!' : 'Copiar código'}
            </Button>
          </Box>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: '#1E222D',
              color: '#CDD6F4',
              fontFamily: "'Consolas', 'Courier New', monospace",
              fontSize: '0.85rem',
              lineHeight: 1.6,
              maxHeight: 280,
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {tentativa.codigoSubmetido || '// Nenhum código registrado'}
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          startIcon={<RestoreIcon />}
          onClick={() => {
            onRestaurarCodigo(tentativa.codigoSubmetido);
            onClose();
          }}
          disabled={!tentativa.codigoSubmetido}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Carregar este código no editor
        </Button>
        <Button variant="contained" onClick={onClose} sx={{ textTransform: 'none', px: 3 }}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Componente Principal ───────────────────────────────────────────────────

export default function CodeSubmissionPage() {
  const { uuid: atividadeUuid, funcaoUuid } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useSnackbar();

  // Estados principais
  const [funcao, setFuncao] = useState(null);
  const [atividade, setAtividade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [codigo, setCodigo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [historicoTentativas, setHistoricoTentativas] = useState([]);
  const [expandedCases, setExpandedCases] = useState({});
  const [modalDetalhesOpen, setModalDetalhesOpen] = useState(false);
  const [tentativaSelecionada, setTentativaSelecionada] = useState(null);

  // Carregar histórico de tentativas
  const fetchHistorico = useCallback(async () => {
    if (!funcaoUuid) return [];
    try {
      const submissoes = await getSubmissoes();
      const filtradas = submissoes.filter(
        (sub) =>
          sub.funcaoUuid === funcaoUuid &&
          (!atividadeUuid || sub.atividadeUuid === atividadeUuid)
      );
      setHistoricoTentativas(filtradas);
      return filtradas;
    } catch {
      showError('Erro ao carregar o histórico de tentativas');
      return [];
    }
  }, [funcaoUuid, atividadeUuid, showError]);

  // Carregar dados iniciais da função e da atividade
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        let funcaoData = null;
        let atividadeData = null;

        if (atividadeUuid) {
          const [atividadeBase, funcoesAtividade] = await Promise.all([
            getAtividade(atividadeUuid),
            getFuncoesAtividade(atividadeUuid),
          ]);
          atividadeData = { ...atividadeBase, funcoes: funcoesAtividade };
          setAtividade(atividadeData);

          const found = (atividadeData?.funcoes || []).find(
            (f) => (f.funcaoUuid || f.uuid) === funcaoUuid
          );
          if (found) funcaoData = found;
        }

        if (!funcaoData) {
          funcaoData = await getFuncao(funcaoUuid);
        }

        setFuncao(funcaoData);

        // Inicializar código do template
        const templateInicial = generateInitialTemplate(funcaoData);
        setCodigo(templateInicial);

        // Carregar histórico e selecionar a tentativa mais recente para visualização
        const hist = await fetchHistorico();
        if (hist && hist.length > 0) {
          setResultado(hist[0]);
          if (hist[0].codigoSubmetido) {
            setCodigo(hist[0].codigoSubmetido);
          }
          // Inicializar acordeons de casos de teste expandidos
          const initialExpanded = {};
          (funcaoData?.casosTeste || []).forEach((c, idx) => {
            initialExpanded[c.uuid || idx] = true;
          });
          setExpandedCases(initialExpanded);
        }
      } catch {
        showError('Erro ao carregar dados da função');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [funcaoUuid, atividadeUuid, showError, fetchHistorico]);

  // Metadados contextuais
  const af = atividade?.funcoes?.find((f) => (f.funcaoUuid || f.uuid) === funcaoUuid);
  const pontosMax = af?.peso ?? funcao?.notaMaxima ?? funcao?.peso ?? funcao?.pontos ?? 10;
  const rawDificuldade = (af?.dificuldade ?? funcao?.dificuldadePadrao ?? funcao?.dificuldade ?? 'medio').toLowerCase();
  const dificuldadeConfig = DIFICULDADE_CONFIG[rawDificuldade] || DIFICULDADE_CONFIG.medio;

  const todosCasos = af?.casosTeste || funcao?.casosTeste || [];
  // Filtrar apenas casos visíveis/públicos para os alunos
  const casosVisiveis = todosCasos.filter((c) => {
    if (c.oculto === true) return false;
    const vis = (c.visibilidade || '').toUpperCase();
    if (vis === 'OCULTO') return false;
    return vis === 'VISIVEL' || vis === 'PUBLICO' || c.visible === true;
  });

  const isProva = atividade?.tipo?.toUpperCase() === 'PROVA';
  const jaEnviouProva = isProva && historicoTentativas.some(
    (t) => !t.falhaTecnica && t.status !== 'FALHA_TECNICA' && t.status !== 'ERRO_COMPILACAO'
  );
  const isFechada =
    atividade?.status === 'ENCERRADA' ||
    (atividade?.dataFechamento && new Date(atividade.dataFechamento) < new Date());

  const melhorTentativaComNotaMaxima = historicoTentativas.find((t) => {
    if (t.falhaTecnica || t.status === 'ERRO_COMPILACAO') return false;
    const max = t.notaMaxima || pontosMax;
    const atingiuNota = t.nota != null && max != null && Number(t.nota) >= Number(max);
    const atingiuCasos = t.casosAprovados != null && t.totalCasos != null && t.totalCasos > 0 && t.casosAprovados === t.totalCasos;
    return atingiuNota || atingiuCasos;
  });

  const resultadoAtingiuNotaMaxima = resultado && !resultado.falhaTecnica && resultado.status !== 'ERRO_COMPILACAO' && (
    (resultado.nota != null && pontosMax != null && Number(resultado.nota) >= Number(pontosMax)) ||
    (resultado.casosAprovados != null && resultado.totalCasos != null && resultado.totalCasos > 0 && resultado.casosAprovados === resultado.totalCasos)
  );

  const jaAtingiuNotaMaxima = Boolean(melhorTentativaComNotaMaxima || resultadoAtingiuNotaMaxima);
  const submissaoNotaMaxima = melhorTentativaComNotaMaxima || (resultadoAtingiuNotaMaxima ? resultado : null);
  const submissaoNotaMaximaUuid = submissaoNotaMaxima?.uuid;

  const isErroCompilacao = resultado?.status === 'ERRO_COMPILACAO';
  const isFalhaTecnica = Boolean(resultado?.falhaTecnica || resultado?.status === 'FALHA_TECNICA');
  const isNaoExecutado = isErroCompilacao || isFalhaTecnica;
  const isEnvioRegistrado = (resultado?.status === 'ENVIO_REGISTRADO' || (resultado && resultado.nota == null && !isFalhaTecnica && isProva)) && !isErroCompilacao;
  const isRestrito = isEnvioRegistrado && !isErroCompilacao && !isFalhaTecnica;

  const tentativasUsadas = isProva
    ? historicoTentativas.filter((t) => !t.falhaTecnica && t.status !== 'FALHA_TECNICA' && t.status !== 'ERRO_COMPILACAO').length
    : historicoTentativas.filter((t) => !t.falhaTecnica && t.status !== 'FALHA_TECNICA').length;
  const hasSubmissoes = tentativasUsadas > 0 || (resultado !== null && !isErroCompilacao && !isFalhaTecnica);
  const hasTentativas = historicoTentativas.length > 0 || resultado !== null;

  // Enviar tentativa de código
  const handleSubmit = async () => {
    if (!codigo.trim() || submitting || isFechada || jaEnviouProva || jaAtingiuNotaMaxima) return;
    setSubmitting(true);

    try {
      const res = await createSubmissao(funcaoUuid, codigo);
      setResultado(res);

      // Atualizar lista de tentativas
      const novoHist = await fetchHistorico();
      const ultimaTentativa = (novoHist && novoHist.length > 0) ? novoHist[0] : res;
      setResultado(ultimaTentativa);

      const atingiuMax = (
        (ultimaTentativa?.nota != null && pontosMax != null && Number(ultimaTentativa.nota) >= Number(pontosMax)) ||
        (ultimaTentativa?.casosAprovados != null && ultimaTentativa?.totalCasos != null && ultimaTentativa.totalCasos > 0 && ultimaTentativa.casosAprovados === ultimaTentativa.totalCasos)
      );

      if (isProva) {
        if (res.status === 'ERRO_COMPILACAO') {
          showError('Falha na compilação do código (GCC). A tentativa não foi consumida. Corrija os erros e envie novamente.');
        } else if (res.status === 'FALHA_TECNICA' || res.falhaTecnica) {
          showError('Houve uma falha técnica do sistema. A tentativa não foi consumida.');
        } else {
          showSuccess('Prova enviada com sucesso! O resultado fica sob sigilo até o término da prova.');
        }
      } else if (atingiuMax) {
        showSuccess('Parabéns! Você tirou a nota máxima nesta função!');
      } else {
        showSuccess('Tentativa avaliada com sucesso!');
      }

      // Expandir casos de teste para visualização imediata do feedback (se não for restrito)
      if (!isProva && ultimaTentativa?.status !== 'ENVIO_REGISTRADO') {
        const exp = {};
        casosVisiveis.forEach((c, i) => {
          exp[c.uuid || i] = true;
        });
        setExpandedCases(exp);
      }
    } catch (err) {
      const apiMessage = err.response?.data?.erro || err.response?.data?.detail;
      if (apiMessage?.includes('já entregue')) {
        showError('Esta atividade já foi entregue.');
      } else if (apiMessage?.includes('nota máxima') || apiMessage?.includes('pontuação máxima')) {
        showError('Você já atingiu a pontuação máxima para esta função.');
      } else if (apiMessage?.includes('limite') || apiMessage?.includes('tentativa')) {
        showError('Você atingiu o limite de tentativas para esta função.');
      } else {
        showError(apiMessage || 'Erro ao submeter código para avaliação.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Restaurar template inicial
  const handleRestaurarTemplate = () => {
    const template = generateInitialTemplate(funcao);
    setCodigo(template);
    showSuccess('Template de código restaurado!');
  };

  // Restaurar código de uma tentativa anterior
  const handleRestaurarCodigoTentativa = (codSubmetido) => {
    if (codSubmetido) {
      setCodigo(codSubmetido);
      showSuccess('Código da tentativa carregado no editor!');
    }
  };

  // Prevenir paste no modo prova se configurado
  const handlePaste = (e) => {
    if (atividade?.bloquearPaste) {
      e.preventDefault();
      showError('Copiar e colar está bloqueado nesta atividade (Modo Prova).');
    }
  };

  // Alternar abertura do acordeom de caso
  const toggleCase = (key) => {
    setExpandedCases((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Abrir modal de detalhes
  const handleOpenDetalhes = (tentativa) => {
    setTentativaSelecionada(tentativa);
    setModalDetalhesOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Skeleton variant="text" width={280} height={24} />
        <Skeleton variant="rectangular" height={70} sx={{ borderRadius: 3 }} />
        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 3 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr' }, gap: 3 }}>
          <Skeleton variant="rectangular" height={420} sx={{ borderRadius: 3 }} />
          <Skeleton variant="rectangular" height={420} sx={{ borderRadius: 3 }} />
        </Box>
      </Box>
    );
  }

  const funcName = funcao?.nome || funcao?.nomeFuncao || funcao?.nome_funcao || 'funcao';

  // Cálculos do card de resultado ativo
  const totalCasosAvaliacao = resultado?.totalCasos ?? null;
  const casosAprovadosAvaliacao = resultado?.casosAprovados ?? 0;
  const notaObtida = resultado?.nota;
  const percentAprovado = totalCasosAvaliacao > 0 ? Math.round((casosAprovadosAvaliacao / totalCasosAvaliacao) * 100) : 0;
  const isConcluida = casosAprovadosAvaliacao === totalCasosAvaliacao && totalCasosAvaliacao > 0;

  return (
    <Box className="fade-in" sx={{ maxWidth: 1240, mx: 'auto', p: { xs: 2, md: 3.5 }, pb: 8 }}>
      {/* ─── Breadcrumbs ─────────────────────────────────────────────────── */}
      <Breadcrumbs sx={{ mb: 2, fontSize: '0.875rem' }}>
        <Link
          underline="hover"
          color="text.secondary"
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate('/aluno/atividades')}
        >
          Atividades
        </Link>
        <Link
          underline="hover"
          color="text.secondary"
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate(`/aluno/atividades/${atividadeUuid}`)}
        >
          {atividade?.titulo || 'Atividade'}
        </Link>
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>
          {funcName}()
        </Typography>
      </Breadcrumbs>

      {/* ─── Top Header ──────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
        }}
      >
        {/* Esquerda: Voltar, Ícone, Nome da Função, Badge de Dificuldade */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tooltip title="Voltar para a atividade">
            <IconButton
              onClick={() => navigate(`/aluno/atividades/${atividadeUuid}`)}
              sx={{ color: '#0F172A', p: 0.5 }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <CodeIcon sx={{ color: '#0284C7', fontSize: 28 }} />
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
            }}
          >
            {funcName}()
          </Typography>
          <Chip
            label={dificuldadeConfig.label}
            size="small"
            sx={{
              backgroundColor: dificuldadeConfig.bg,
              color: dificuldadeConfig.text,
              fontWeight: 700,
              fontSize: '0.75rem',
              borderRadius: '16px',
              px: 0.8,
              height: 24,
            }}
          />
        </Box>

        {/* Direita: Pontos e Botão de Voltar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chip
            label={formatPoints(pontosMax)}
            variant="outlined"
            sx={{
              borderColor: '#0284C7',
              color: '#0284C7',
              fontWeight: 700,
              fontSize: '0.85rem',
              borderRadius: '20px',
              height: 32,
              px: 1,
            }}
          />
          <Button
            variant="outlined"
            onClick={() => navigate(`/aluno/atividades/${atividadeUuid}`)}
            sx={{
              borderColor: '#0284C7',
              color: '#0284C7',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              borderRadius: 2,
              px: 2,
              py: 0.75,
              '&:hover': {
                borderColor: '#0369A1',
                backgroundColor: 'rgba(2, 132, 199, 0.04)',
              },
            }}
          >
            ← Voltar para Atividade
          </Button>
        </Box>
      </Box>

      {/* ─── Card de Enunciado ───────────────────────────────────────────── */}
      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          borderColor: '#E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          mb: 3,
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: '#0F172A',
              mb: 1.2,
              fontSize: '1.1rem',
            }}
          >
            Enunciado
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: '#334155',
              lineHeight: 1.6,
              mb: 2.5,
              fontSize: '0.938rem',
            }}
          >
            {funcao?.descricao || funcao?.enunciado || 'Implemente a função solicitada conforme as orientações.'}
          </Typography>

          {/* Badges de Metadados: Tentativas Realizadas e Casos Visíveis */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                px: 1.8,
                py: 0.6,
                color: '#475569',
                fontSize: '0.8125rem',
                fontWeight: 500,
              }}
            >
              <BarChartIcon sx={{ fontSize: 18, color: '#0284C7' }} />
              <span>Tentativas realizadas: {tentativasUsadas}</span>
            </Box>

            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                px: 1.8,
                py: 0.6,
                color: '#475569',
                fontSize: '0.8125rem',
                fontWeight: 500,
              }}
            >
              <InsertDriveFileOutlinedIcon sx={{ fontSize: 18, color: '#0284C7' }} />
              <span>Casos visíveis: {casosVisiveis.length}</span>
            </Box>
          </Box>

          {/* Dicas Pedagógicas (Preservação de fluxo do backend) */}
          {funcao?.dicas && funcao.dicas.length > 0 && funcao.dicas.some(Boolean) && (
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #F1F5F9' }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, color: '#475569', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <LightbulbOutlinedIcon sx={{ color: '#F59E0B', fontSize: 20 }} />
                Dicas pedagógicas
              </Typography>
              {funcao.dicas.map((dica, index) => {
                if (!dica) return null;
                const tentativasNecessarias = index + 1;
                const bloqueada = tentativasUsadas < tentativasNecessarias;
                return (
                  <Accordion
                    key={index}
                    disabled={bloqueada}
                    sx={{
                      mb: 1,
                      '&:before': { display: 'none' },
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px !important',
                      boxShadow: 'none',
                    }}
                  >
                    <AccordionSummary expandIcon={<KeyboardArrowDownIcon />}>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: bloqueada ? '#94A3B8' : '#1E293B' }}>
                        Dica {index + 1} {bloqueada ? `(Desbloqueia após ${tentativasNecessarias} tentativa${tentativasNecessarias > 1 ? 's' : ''})` : ''}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" color="text.secondary">
                        {dica}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ─── Alertas de Restrição (Nota Máxima, Modo Prova e Prazo) ──────────── */}
      {isFechada && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          O prazo para entrega desta atividade encerrou. O envio de novas submissões está desabilitado.
        </Alert>
      )}

      {jaAtingiuNotaMaxima && !isFechada && (
        <Card
          elevation={0}
          sx={{
            mb: 3,
            p: 2.5,
            borderRadius: 3,
            border: '1.5px solid #86EFAC',
            bgcolor: '#F0FDF4',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              bgcolor: '#DCFCE7',
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <TaskAltIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, color: '#14532D', fontSize: '1rem' }}>
              Parabéns! Você tirou a nota máxima nesta função ({formatScoreDisplay(pontosMax, pontosMax)} pts)
            </Typography>
            <Typography sx={{ color: '#166534', fontSize: '0.84rem', mt: 0.25 }}>
              Esta função foi concluída com sucesso. Novas submissões estão bloqueadas para esta função.
            </Typography>
          </Box>
        </Card>
      )}

      {jaEnviouProva && !jaAtingiuNotaMaxima && !isFechada && (
        <Card
          elevation={0}
          sx={{
            mb: 3,
            p: 2.25,
            borderRadius: 3,
            border: '1.5px solid #FDE68A',
            bgcolor: '#FEF9ED',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2.5,
              bgcolor: '#FEF3C7',
              color: '#B45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <TaskAltIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, color: '#78350F', fontSize: '0.95rem' }}>
              Resposta para esta função da prova já enviada
            </Typography>
            <Typography sx={{ color: '#92400E', fontSize: '0.825rem', mt: 0.25 }}>
              Sua resposta foi registrada com sucesso. Uma nova submissão não é permitida nesta prova.
            </Typography>
          </Box>
        </Card>
      )}

      {/* ─── Grid Principal: Editor de Código + Painel Direito ──────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.25fr 1fr' },
          gap: 3,
          alignItems: 'start',
          mb: 4,
        }}
      >
        {/* ── Coluna Esquerda: Editor de Código ───────────────────────────── */}
        <Card
          variant="outlined"
          sx={{
            borderRadius: 3,
            borderColor: '#E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            p: { xs: 2, sm: 2.5 },
          }}
        >
          {/* Header do Editor: Título e Seletor de Linguagem */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1.5,
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CodeIcon sx={{ color: '#0284C7', fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>
                Implementação da função {funcName}()
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {jaAtingiuNotaMaxima && (
                <Chip
                  label="Nota máxima atingida (Modo Leitura)"
                  size="small"
                  icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#16A34A !important' }} />}
                  sx={{
                    bgcolor: '#DCFCE7',
                    color: '#15803D',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    height: 26,
                  }}
                />
              )}
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                Linguagem:
              </Typography>
              <Select
                value="C (GCC)"
                size="small"
                disabled
                sx={{
                  height: 32,
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  bgcolor: '#F8FAFC',
                  borderRadius: 1.5,
                  '& .MuiSelect-select': { py: 0.5, px: 1.5 },
                }}
              >
                <MenuItem value="C (GCC)">C (GCC)</MenuItem>
              </Select>
            </Box>
          </Box>

          {/* Área do Editor com Gutter de Linhas */}
          <CodeEditor
            value={codigo}
            onChange={setCodigo}
            onPaste={handlePaste}
            disabled={submitting || isFechada || jaEnviouProva || jaAtingiuNotaMaxima}
          />

          {/* Botões de Ação do Editor */}
          <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
            <Button
              id="btn-enviar-tentativa"
              variant="contained"
              startIcon={
                submitting ? (
                  <CircularProgress size={18} color="inherit" />
                ) : jaAtingiuNotaMaxima ? (
                  <CheckCircleIcon />
                ) : jaEnviouProva ? (
                  <TaskAltIcon />
                ) : (
                  <PlayArrowIcon />
                )
              }
              onClick={handleSubmit}
              disabled={submitting || !codigo.trim() || isFechada || jaEnviouProva || jaAtingiuNotaMaxima}
              sx={{
                flex: { xs: 1, sm: 'auto' },
                minWidth: 170,
                py: 1.1,
                px: 3,
                backgroundColor: jaAtingiuNotaMaxima ? '#16A34A' : '#0284C7',
                color: '#FFFFFF',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                borderRadius: 2,
                boxShadow: jaAtingiuNotaMaxima ? 'none' : '0 2px 4px rgba(2, 132, 199, 0.25)',
                '&:hover': {
                  backgroundColor: jaAtingiuNotaMaxima ? '#15803D' : '#0369A1',
                },
                '&.Mui-disabled': {
                  backgroundColor: jaAtingiuNotaMaxima ? '#86EFAC' : '#94A3B8',
                  color: jaAtingiuNotaMaxima ? '#14532D' : '#FFFFFF',
                },
              }}
            >
              {submitting
                ? 'Avaliando no Judge0...'
                : jaAtingiuNotaMaxima
                ? 'Nota máxima atingida'
                : jaEnviouProva
                ? 'Tentativa registrada'
                : 'Enviar tentativa'}
            </Button>

            <Button
              id="btn-restaurar-template"
              variant="outlined"
              startIcon={<RestartAltIcon />}
              onClick={handleRestaurarTemplate}
              disabled={submitting || isFechada || jaEnviouProva || jaAtingiuNotaMaxima}
              sx={{
                flex: { xs: 1, sm: 'auto' },
                py: 1.1,
                px: 2.5,
                borderColor: '#0284C7',
                color: '#0284C7',
                backgroundColor: '#FFFFFF',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                borderRadius: 2,
                '&:hover': {
                  borderColor: '#0369A1',
                  backgroundColor: 'rgba(2, 132, 199, 0.04)',
                },
              }}
            >
              Restaurar template
            </Button>
          </Box>
        </Card>

        {/* ── Coluna Direita: Orientações / Resultado + Casos de Teste ─────── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Card Superior: "Orientações" (0 tentativas) OU "Resultado da tentativa" (com envio) */}
          {!hasTentativas ? (
            /* Mockup Imagem 1: Orientações Iniciais */
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: '#E2E8F0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                p: { xs: 2.5, sm: 3 },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <MenuBookIcon sx={{ color: '#0284C7', fontSize: 22 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1.05rem' }}>
                  Orientações
                </Typography>
              </Box>

              <Box
                sx={{
                  backgroundColor: '#F0F7FF',
                  borderRadius: 2.5,
                  p: 2.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.8,
                }}
              >
                {[
                  'Implemente apenas a função solicitada.',
                  'Use a assinatura fornecida.',
                  'Confira os casos visíveis antes de enviar.',
                  'Cada envio gera uma nova tentativa.',
                ].map((texto, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: '#DBEAFE',
                        color: '#0284C7',
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </Box>
                    <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500, fontSize: '0.875rem' }}>
                      {texto}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Card>
          ) : isRestrito ? (
            /* Card de Resultado da Prova (Sob Sigilo) */
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: '#FDE68A',
                bgcolor: '#FEF9ED',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                p: { xs: 2.5, sm: 3 },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TaskAltIcon sx={{ color: '#B45309', fontSize: 24 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#78350F', fontSize: '1.05rem' }}>
                    Submissão registrada
                  </Typography>
                </Box>
                <Chip
                  icon={<AccessTimeRoundedIcon sx={{ fontSize: '14px !important', color: '#FFFFFF !important' }} />}
                  label="Recebida"
                  size="small"
                  sx={{
                    bgcolor: '#334E68',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    height: 24,
                    borderRadius: '6px',
                  }}
                />
              </Box>

              <Typography variant="body2" sx={{ color: '#78350F', lineHeight: 1.5, mb: 2, fontSize: '0.84rem' }}>
                Sua resposta para esta função foi enviada e gravada com sucesso. Em avaliações do tipo <strong>Prova</strong>, a validação dos casos de teste e a nota permanecem sob sigilo pedagógico até o término da prova.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 1.75, bgcolor: '#FFFFFF', borderRadius: 2, border: '1px solid #FDE68A', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon sx={{ fontSize: 18, color: '#16A34A' }} />
                  <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600, fontSize: '0.825rem' }}>
                    Código-fonte enviado com sucesso
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon sx={{ fontSize: 18, color: '#16A34A' }} />
                  <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600, fontSize: '0.825rem' }}>
                    Tentativa computada no sistema
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTimeRoundedIcon sx={{ fontSize: 18, color: '#B45309' }} />
                  <Typography variant="body2" sx={{ color: '#92400E', fontWeight: 600, fontSize: '0.825rem' }}>
                    Casos de teste e nota ocultos até a publicação
                  </Typography>
                </Box>
              </Box>
            </Card>
          ) : (
            /* Mockup Imagem 2: Resultado da Tentativa */
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: jaAtingiuNotaMaxima ? '#86EFAC' : isErroCompilacao ? '#FDE68A' : isFalhaTecnica ? '#CBD5E1' : '#E2E8F0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                p: { xs: 2.5, sm: 3 },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {isErroCompilacao ? (
                    <InfoOutlinedIcon sx={{ color: '#D97706', fontSize: 24 }} />
                  ) : isFalhaTecnica ? (
                    <InfoOutlinedIcon sx={{ color: '#64748B', fontSize: 24 }} />
                  ) : (
                    <CheckCircleIcon sx={{ color: jaAtingiuNotaMaxima ? '#16A34A' : '#0284C7', fontSize: 24 }} />
                  )}
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1.05rem' }}>
                    Resultado da tentativa
                  </Typography>
                </Box>
                {jaAtingiuNotaMaxima ? (
                  <Chip
                    icon={<CheckCircleIcon sx={{ fontSize: '15px !important', color: '#15803D !important' }} />}
                    label="Nota máxima atingida"
                    size="small"
                    sx={{
                      backgroundColor: '#DCFCE7',
                      color: '#15803D',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      borderRadius: '12px',
                      px: 0.5,
                      height: 24,
                    }}
                  />
                ) : isErroCompilacao ? (
                  <Tooltip title="O código não compilou no GCC. Os casos de teste não foram executados." arrow>
                    <Chip
                      icon={<InfoOutlinedIcon sx={{ fontSize: '15px !important', color: '#B45309 !important' }} />}
                      label="Erro de compilação"
                      size="small"
                      sx={{
                        backgroundColor: '#FEF3C7',
                        color: '#B45309',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        borderRadius: '12px',
                        px: 0.5,
                        height: 24,
                      }}
                    />
                  </Tooltip>
                ) : isFalhaTecnica ? (
                  <Tooltip title="Instabilidade técnica no ambiente de execução. A tentativa não foi pontuada." arrow>
                    <Chip
                      icon={<InfoOutlinedIcon sx={{ fontSize: '15px !important', color: '#475569 !important' }} />}
                      label="Falha técnica"
                      size="small"
                      sx={{
                        backgroundColor: '#F1F5F9',
                        color: '#475569',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        borderRadius: '12px',
                        px: 0.5,
                        height: 24,
                      }}
                    />
                  </Tooltip>
                ) : null}
              </Box>

              {/* Grid com Última tentativa e Casos aprovados */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', mb: 0.5 }}>
                    Última tentativa
                  </Typography>
                  {isNaoExecutado ? (
                    <Tooltip title={isErroCompilacao ? "O código não compilou, portanto não recebeu nota." : "Instabilidade temporária no ambiente."} arrow>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#64748B', fontSize: '1.85rem' }}>
                        —
                      </Typography>
                    </Tooltip>
                  ) : (
                    <Typography variant="h4" sx={{ fontWeight: 800, color: jaAtingiuNotaMaxima ? '#15803D' : '#0F172A', fontSize: '1.85rem' }}>
                      {formatScoreDisplay(notaObtida, pontosMax)}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', mb: 0.5 }}>
                    Casos aprovados
                  </Typography>
                  {isNaoExecutado ? (
                    <Tooltip title={isErroCompilacao ? "Casos de teste não executados por erro de compilação." : "Casos de teste não avaliados."} arrow>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#64748B', fontSize: '1.85rem' }}>
                        —
                      </Typography>
                    </Tooltip>
                  ) : (
                    <Typography variant="h4" sx={{ fontWeight: 800, color: jaAtingiuNotaMaxima ? '#15803D' : '#0F172A', fontSize: '1.85rem' }}>
                      {totalCasosAvaliacao == null ? '—' : `${casosAprovadosAvaliacao} / ${totalCasosAvaliacao}`}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Barra de Progresso ou Mensagem Informativa de Não Executado */}
              {isErroCompilacao ? (
                <Tooltip title="Os casos de teste não foram executados porque o código C não compilou no GCC." arrow>
                  <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#FFFBEB', borderRadius: 2, border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InfoOutlinedIcon sx={{ color: '#D97706', fontSize: 18, flexShrink: 0 }} />
                    <Typography variant="caption" sx={{ color: '#92400E', fontWeight: 500, fontSize: '0.78rem' }}>
                      Casos de teste não executados por falha na compilação.
                    </Typography>
                  </Box>
                </Tooltip>
              ) : isFalhaTecnica ? (
                <Tooltip title="A correção não pôde ser concluída por falha técnica. Esta tentativa não foi penalizada." arrow>
                  <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InfoOutlinedIcon sx={{ color: '#64748B', fontSize: 18, flexShrink: 0 }} />
                    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500, fontSize: '0.78rem' }}>
                      Casos de teste não avaliados por instabilidade técnica.
                    </Typography>
                  </Box>
                </Tooltip>
              ) : (
                <>
                  <LinearProgress
                    variant="determinate"
                    value={jaAtingiuNotaMaxima ? 100 : percentAprovado}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#E2E8F0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: jaAtingiuNotaMaxima ? '#16A34A' : '#0284C7',
                        borderRadius: 4,
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', textAlign: 'right', mt: 0.75, fontSize: '0.75rem' }}
                  >
                    {jaAtingiuNotaMaxima ? '100' : percentAprovado}% dos casos aprovados
                  </Typography>
                </>
              )}

              {/* Linha de Situação da Avaliação */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mt: 3,
                  pt: 2,
                  borderTop: '1px solid #F1F5F9',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#475569' }}>
                  <SettingsIcon sx={{ fontSize: 18, color: '#0284C7' }} />
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8125rem' }}>
                    Situação da avaliação
                  </Typography>
                </Box>

                <Chip
                  label={isErroCompilacao ? 'Erro de compilação' : isFalhaTecnica ? 'Falha técnica' : isConcluida ? 'Concluída' : 'Em andamento'}
                  size="small"
                  sx={{
                    backgroundColor: isErroCompilacao ? '#FEF3C7' : isFalhaTecnica ? '#F1F5F9' : isConcluida ? '#DCFCE7' : '#E0F2FE',
                    color: isErroCompilacao ? '#B45309' : isFalhaTecnica ? '#475569' : isConcluida ? '#15803D' : '#0284C7',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    borderRadius: '12px',
                    px: 1,
                    height: 24,
                  }}
                />
              </Box>

              {/* Erro de Compilação se houver */}
              {isErroCompilacao && (
                <Alert severity="warning" sx={{ mt: 2, borderRadius: 2, border: '1px solid #FDE68A', bgcolor: '#FEF9ED' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#92400E', mb: 0.5, fontSize: '0.825rem' }}>
                    Saída do compilador GCC:
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: '#78350F', display: 'block' }}>
                    {resultado.erroCompilacao || 'Erro de compilação no GCC.'}
                  </Typography>
                </Alert>
              )}
            </Card>
          )}

          {/* Card Inferior: "Casos de teste visíveis" */}
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              borderColor: '#E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              p: { xs: 2.5, sm: 3 },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScienceIcon sx={{ color: '#0284C7', fontSize: 22 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1.05rem' }}>
                  Casos de teste visíveis
                </Typography>
              </Box>
              {isNaoExecutado && (
                <Tooltip
                  title={
                    isErroCompilacao
                      ? "O código não compilou no GCC, portanto os casos de teste não foram executados."
                      : "Casos de teste não avaliados devido a uma falha técnica."
                  }
                  arrow
                >
                  <Chip
                    icon={<InfoOutlinedIcon sx={{ fontSize: '14px !important', color: '#64748B !important' }} />}
                    label="Não executados"
                    size="small"
                    sx={{
                      backgroundColor: '#F1F5F9',
                      color: '#475569',
                      fontWeight: 600,
                      fontSize: '0.725rem',
                      height: 24,
                      border: '1px solid #CBD5E1',
                    }}
                  />
                </Tooltip>
              )}
            </Box>

            {casosVisiveis.length === 0 ? <NoVisibleTestCasesNotice /> : !hasTentativas || isRestrito ? (
              /* Tabela Limpa de Casos Visíveis (0 tentativas ou Prova sob sigilo) */
              <Box>
                {isRestrito && (
                  <Box sx={{ mb: 2, p: 1.5, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <InfoOutlinedIcon sx={{ fontSize: 18, color: '#2563EB', flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ color: '#1E40AF', fontSize: '0.8rem', lineHeight: 1.4 }}>
                      Modo Prova: Os casos de teste abaixo são disponibilizados apenas para conferência da especificação da função. A validação individual dos testes será divulgada após o encerramento da prova.
                    </Typography>
                  </Box>
                )}
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{ borderRadius: 2, borderColor: '#E2E8F0', overflow: 'hidden' }}
                >
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, color: '#64748B', width: 60 }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#64748B' }}>Entrada</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#64748B' }}>Saída esperada</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {casosVisiveis.map((caso, index) => (
                        <TableRow key={caso.uuid || index} hover>
                          <TableCell>
                            <Box
                              sx={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                backgroundColor: '#E0F2FE',
                                color: '#0284C7',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {caso.numero || index + 1}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#0F172A' }}>
                            <TestCaseInputs entradas={caso.entradas ?? caso.inputs} parametros={funcao.parametros} />
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#0F172A' }}>
                            {formatTestCaseValue(caso.retornoEsperado ?? caso.outputEsperado)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ) : (
              /* Mockup Imagem 2: Acordeons de Casos Aprovados/Reprovados/Não Executados */
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {isNaoExecutado && (
                  <Tooltip
                    title={
                      isErroCompilacao
                        ? "Os casos de teste não foram executados porque o código C não compilou no GCC."
                        : "Os casos de teste não foram avaliados devido a uma falha técnica."
                    }
                    arrow
                  >
                    <Box
                      sx={{
                        p: 1.5,
                        mb: 0.5,
                        bgcolor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                      }}
                    >
                      <InfoOutlinedIcon sx={{ fontSize: 18, color: '#64748B', flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.825rem', lineHeight: 1.4 }}>
                        {isErroCompilacao
                          ? 'Nenhum caso de teste foi executado porque o código continha erros de compilação (GCC). Corrija o código para validar a execução.'
                          : 'Nenhum caso de teste foi avaliado devido a uma instabilidade temporária no ambiente de execução.'}
                      </Typography>
                    </Box>
                  </Tooltip>
                )}

                {casosVisiveis.map((caso, index) => {
                  const caseKey = caso.uuid || index;
                  const isExpanded = expandedCases[caseKey] ?? true;

                  const caseResult = resultado?.resultadosCasos?.find(
                    (rc) => rc.casoTesteAtividadeUuid === caso.uuid || rc.caso_uuid === caso.uuid
                  );
                  const aprovado = caseResult?.aprovado === true;
                  const caseNotExecuted = isNaoExecutado || caseResult?.statusRetorno === 'NAO_EXECUTADO';

                  const esperadoStr = formatTestCaseValue(caso.retornoEsperado ?? caso.outputEsperado);

                  const borderColor = caseNotExecuted ? '#E2E8F0' : aprovado ? '#BBF7D0' : '#FECACA';
                  const headerBgColor = caseNotExecuted ? '#F8FAFC' : aprovado ? '#F0FDF4' : '#FEF2F2';

                  return (
                    <Box
                      key={caseKey}
                      sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: borderColor,
                      }}
                    >
                      {/* Barra de Título do Caso */}
                      <Box
                        onClick={() => toggleCase(caseKey)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          px: 2,
                          py: 1.25,
                          backgroundColor: headerBgColor,
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        {/* Esquerda: Número em círculo + "Caso X" */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              backgroundColor: '#E0F2FE',
                              color: '#0284C7',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {caso.numero || index + 1}
                          </Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                            Caso {caso.numero || index + 1}
                          </Typography>
                        </Box>

                        {/* Direita: Badge Aprovado/Reprovado/Não executado + Chevron */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {caseNotExecuted ? (
                            <Tooltip
                              title={
                                isErroCompilacao
                                  ? 'Caso de teste não executado devido a erro de compilação no GCC.'
                                  : caseResult?.statusRetorno === 'NAO_EXECUTADO'
                                    ? 'Caso não executado porque uma execução anterior foi interrompida.'
                                    : 'Caso de teste não avaliado devido a falha técnica.'
                              }
                              arrow
                            >
                              <Chip
                                icon={<InfoOutlinedIcon sx={{ fontSize: '15px !important', color: '#64748B !important' }} />}
                                label="Não executado"
                                size="small"
                                sx={{
                                  backgroundColor: '#F1F5F9',
                                  color: '#475569',
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  borderRadius: '12px',
                                  border: '1px solid #CBD5E1',
                                  height: 24,
                                }}
                              />
                            </Tooltip>
                          ) : aprovado ? (
                            <Chip
                              icon={<CheckCircleIcon sx={{ fontSize: '15px !important', color: '#16A34A !important' }} />}
                              label="Aprovado"
                              size="small"
                              sx={{
                                backgroundColor: '#DCFCE7',
                                color: '#16A34A',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                borderRadius: '12px',
                                height: 24,
                              }}
                            />
                          ) : (
                            <Chip
                              icon={<CancelIcon sx={{ fontSize: '15px !important', color: '#DC2626 !important' }} />}
                              label={caseResult?.statusRetorno === 'ERRO_EXECUCAO' ? 'Erro de execução' : 'Reprovado'}
                              size="small"
                              sx={{
                                backgroundColor: '#FEE2E2',
                                color: '#DC2626',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                borderRadius: '12px',
                                height: 24,
                              }}
                            />
                          )}
                          <IconButton size="small" sx={{ p: 0.25, color: '#64748B' }}>
                            {isExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                          </IconButton>
                        </Box>
                      </Box>

                      {/* Corpo Expandido do Caso: Entrada, Esperado, Obtido */}
                      <Collapse in={isExpanded}>
                        <Box
                          sx={{
                            backgroundColor: '#FFFFFF',
                            p: 2,
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
                            gap: 2,
                            borderTop: '1px solid',
                            borderColor: borderColor,
                          }}
                        >
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                              Entrada
                            </Typography>
                            <Box sx={{ fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: 700, color: '#0F172A' }}>
                              <TestCaseInputs entradas={caso.entradas ?? caso.inputs} parametros={funcao.parametros} />
                            </Box>
                          </Box>

                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                              Esperado
                            </Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#0F172A' }}>
                              {esperadoStr}
                            </Typography>
                          </Box>

                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                              Obtido
                            </Typography>
                            {caseNotExecuted ? (
                              <Tooltip
                                title={
                                  isErroCompilacao
                                    ? 'O código não compilou no GCC, portanto nenhuma saída foi produzida.'
                                    : caseResult?.statusRetorno === 'NAO_EXECUTADO'
                                      ? 'Uma execução anterior foi interrompida.'
                                      : 'Não avaliado devido a falha técnica.'
                                }
                                arrow
                              >
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: 'monospace',
                                    fontWeight: 600,
                                    color: '#64748B',
                                  }}
                                >
                                  — (Não executado)
                                </Typography>
                              </Tooltip>
                            ) : (
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', overflowWrap: 'anywhere', color: aprovado ? '#0F172A' : '#DC2626' }}>{formatCapturedReturn(caseResult)}</Typography>
                            )}
                          </Box>
                        </Box>
                      </Collapse>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Card>
        </Box>
      </Box>

      {/* ─── Card de Histórico de Tentativas Desta Função ────────────────── */}
      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          borderColor: '#E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          p: { xs: 2.5, sm: 3 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <HistoryIcon sx={{ color: '#0284C7', fontSize: 22 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1.05rem' }}>
            Histórico de tentativas desta função {!hasTentativas ? '(0)' : ''}
          </Typography>
        </Box>

        {!hasTentativas ? (
          /* Mockup Imagem 1: Banner Informativo de 0 Tentativas */
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              backgroundColor: '#F0F7FF',
              border: '1px solid #BAE6FD',
              borderRadius: 2,
              p: 2,
              color: '#0284C7',
            }}
          >
            <InfoOutlinedIcon sx={{ fontSize: 20 }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Você ainda não enviou tentativas para esta função.
            </Typography>
          </Box>
        ) : (
          /* Mockup Imagem 2: Tabela de Histórico de Tentativas */
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ borderRadius: 2, borderColor: '#E2E8F0', overflow: 'hidden' }}
          >
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: '#64748B', py: 1.5 }}>Tentativa</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#64748B' }}>Enviada em</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#64748B' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#64748B' }}>Nota</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#64748B' }}>Casos aprovados</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#64748B' }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historicoTentativas.map((tentativa) => {
                  const tentIsRestrito = tentativa.status === 'ENVIO_REGISTRADO' || (isProva && tentativa.nota == null && !tentativa.falhaTecnica);
                  const isAvaliada = (tentativa.status === 'AVALIADA' || tentativa.status === 'avaliado') && !tentIsRestrito;
                  const isErroCompilacao = tentativa.status === 'ERRO_COMPILACAO';

                  return (
                    <TableRow key={tentativa.uuid} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#0F172A' }}>
                        #{tentativa.tentativaNumero}
                      </TableCell>
                      <TableCell sx={{ color: '#475569', fontSize: '0.85rem' }}>
                        {formatTimestamp(tentativa.dataSubmissao)}
                      </TableCell>
                      <TableCell>
                        {tentIsRestrito ? (
                          <Chip
                            icon={<AccessTimeRoundedIcon sx={{ fontSize: '14px !important', color: '#FFFFFF !important' }} />}
                            label="Recebida"
                            size="small"
                            sx={{
                              backgroundColor: '#334E68',
                              color: '#FFFFFF',
                              fontWeight: 700,
                              borderRadius: '16px',
                              px: 0.5,
                              height: 24,
                            }}
                          />
                        ) : isAvaliada ? (
                          <Chip
                            icon={<CheckCircleIcon sx={{ fontSize: '15px !important', color: '#15803D !important' }} />}
                            label="Avaliada"
                            size="small"
                            sx={{
                              backgroundColor: '#DCFCE7',
                              color: '#15803D',
                              fontWeight: 600,
                              borderRadius: '16px',
                              px: 0.5,
                              height: 24,
                            }}
                          />
                        ) : isErroCompilacao ? (
                          <Chip
                            icon={<CancelIcon sx={{ fontSize: '15px !important', color: '#B91C1C !important' }} />}
                            label="Erro de compilação"
                            size="small"
                            sx={{
                              backgroundColor: '#FEE2E2',
                              color: '#B91C1C',
                              fontWeight: 600,
                              borderRadius: '16px',
                              px: 0.5,
                              height: 24,
                            }}
                          />
                        ) : (
                          <Chip
                            label={tentativa.status}
                            size="small"
                            sx={{
                              backgroundColor: '#F1F5F9',
                              color: '#475569',
                              fontWeight: 600,
                              borderRadius: '16px',
                              px: 0.5,
                              height: 24,
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: isErroCompilacao ? '#94A3B8' : tentIsRestrito ? '#64748B' : '#0F172A' }}>
                        {tentIsRestrito ? 'Sob sigilo' : isErroCompilacao ? '—' : formatScoreDisplay(tentativa.nota, tentativa.notaMaxima || pontosMax)}
                      </TableCell>
                      <TableCell sx={{ color: isErroCompilacao ? '#94A3B8' : tentIsRestrito ? '#64748B' : '#0F172A', fontWeight: 500 }}>
                        {tentIsRestrito ? 'Sob sigilo' : isErroCompilacao || tentativa.totalCasos == null ? '—' : `${tentativa.casosAprovados ?? 0} / ${tentativa.totalCasos}`}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
                          onClick={() => navigate(`/aluno/submissoes/${tentativa.uuid}`)}
                          sx={{
                            color: '#0284C7',
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.8125rem',
                            p: 0.5,
                            '&:hover': {
                              backgroundColor: 'rgba(2, 132, 199, 0.06)',
                            },
                          }}
                        >
                          Ver detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* ─── Modal de Detalhes da Tentativa Selecionada ─────────────────── */}
      <DetalhesTentativaDialog
        open={modalDetalhesOpen}
        onClose={() => setModalDetalhesOpen(false)}
        tentativa={tentativaSelecionada}
        onRestaurarCodigo={handleRestaurarCodigoTentativa}
      />
    </Box>
  );
}

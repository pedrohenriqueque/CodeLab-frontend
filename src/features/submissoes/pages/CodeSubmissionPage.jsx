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

import { getFuncao, getAtividade, getFuncoesAtividade } from '../../atividades/api';
import { createSubmissao, getSubmissoes } from '../api';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';

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

function formatCaseIO(val) {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      return `[${val.join(', ')}]`;
    }
    if ('retorno' in val) {
      const ret = val.retorno;
      return Array.isArray(ret) ? `[${ret.join(', ')}]` : String(ret);
    }
    if ('valor' in val) {
      const v = val.valor;
      return Array.isArray(v) ? `[${v.join(', ')}]` : String(v);
    }
    const keys = Object.keys(val);
    if (keys.length === 1) {
      const item = val[keys[0]];
      return Array.isArray(item) ? `[${item.join(', ')}]` : String(item);
    }
    const parts = Object.values(val).map((v) => (Array.isArray(v) ? `[${v.join(', ')}]` : String(v)));
    return parts.length === 1 ? parts[0] : parts.join(', ');
  }
  return String(val);
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
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {tentativa.totalCasos ? `${tentativa.casosAprovados} / ${tentativa.totalCasos}` : '—'}
            </Typography>
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
  const jaEnviouProva = isProva && historicoTentativas.some((t) => !t.falhaTecnica);
  const isFechada =
    atividade?.status === 'ENCERRADA' ||
    (atividade?.dataFechamento && new Date(atividade.dataFechamento) < new Date());

  const tentativasUsadas = historicoTentativas.length;
  const hasSubmissoes = tentativasUsadas > 0 || resultado !== null;

  // Enviar tentativa de código
  const handleSubmit = async () => {
    if (!codigo.trim() || submitting || isFechada || jaEnviouProva) return;
    setSubmitting(true);

    try {
      const res = await createSubmissao(funcaoUuid, codigo);
      setResultado(res);
      showSuccess(isProva ? 'Prova enviada com sucesso!' : 'Tentativa avaliada com sucesso!');

      // Atualizar lista de tentativas
      const novoHist = await fetchHistorico();
      if (novoHist && novoHist.length > 0) {
        setResultado(novoHist[0]);
      }

      // Expandir casos de teste para visualização imediata do feedback
      const exp = {};
      casosVisiveis.forEach((c, i) => {
        exp[c.uuid || i] = true;
      });
      setExpandedCases(exp);
    } catch (err) {
      const apiMessage = err.response?.data?.erro || err.response?.data?.detail;
      if (apiMessage?.includes('já entregue')) {
        showError('Esta atividade já foi entregue.');
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
  const totalCasosAvaliacao = resultado?.totalCasos || casosVisiveis.length || 2;
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

      {/* ─── Alertas de Restrição (Modo Prova e Prazo) ──────────────────── */}
      {isFechada && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          O prazo para entrega desta atividade encerrou. O envio de novas submissões está desabilitado.
        </Alert>
      )}

      {jaEnviouProva && !isFechada && (
        <Alert severity="info" icon={<TaskAltIcon />} sx={{ mb: 3, borderRadius: 2 }}>
          Sua resposta para esta função da prova já foi enviada. Uma nova submissão não é permitida.
        </Alert>
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
            disabled={submitting || isFechada || jaEnviouProva}
          />

          {/* Botões de Ação do Editor */}
          <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
            <Button
              id="btn-enviar-tentativa"
              variant="contained"
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
              onClick={handleSubmit}
              disabled={submitting || !codigo.trim() || isFechada || jaEnviouProva}
              sx={{
                flex: { xs: 1, sm: 'auto' },
                minWidth: 170,
                py: 1.1,
                px: 3,
                backgroundColor: '#0284C7',
                color: '#FFFFFF',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                borderRadius: 2,
                boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
                '&:hover': {
                  backgroundColor: '#0369A1',
                },
                '&.Mui-disabled': {
                  backgroundColor: '#94A3B8',
                  color: '#FFFFFF',
                },
              }}
            >
              {submitting ? 'Avaliando no Judge0...' : jaEnviouProva ? 'Tentativa registrada' : 'Enviar tentativa'}
            </Button>

            <Button
              id="btn-restaurar-template"
              variant="outlined"
              startIcon={<RestartAltIcon />}
              onClick={handleRestaurarTemplate}
              disabled={submitting || isFechada || jaEnviouProva}
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
          {!hasSubmissoes ? (
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
          ) : (
            /* Mockup Imagem 2: Resultado da Tentativa */
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: '#E2E8F0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                p: { xs: 2.5, sm: 3 },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                <CheckCircleIcon sx={{ color: '#0284C7', fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1.05rem' }}>
                  Resultado da tentativa
                </Typography>
              </Box>

              {/* Grid com Última tentativa e Casos aprovados */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', mb: 0.5 }}>
                    Última tentativa
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.85rem' }}>
                    {formatScoreDisplay(notaObtida, pontosMax)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', mb: 0.5 }}>
                    Casos aprovados
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.85rem' }}>
                    {casosAprovadosAvaliacao} / {totalCasosAvaliacao}
                  </Typography>
                </Box>
              </Box>

              {/* Barra de Progresso Azul */}
              <LinearProgress
                variant="determinate"
                value={percentAprovado}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#E2E8F0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#0284C7',
                    borderRadius: 4,
                  },
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', textAlign: 'right', mt: 0.75, fontSize: '0.75rem' }}
              >
                {percentAprovado}% dos casos aprovados
              </Typography>

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
                  label={isConcluida ? 'Concluída' : 'Em andamento'}
                  size="small"
                  sx={{
                    backgroundColor: isConcluida ? '#DCFCE7' : '#E0F2FE',
                    color: isConcluida ? '#15803D' : '#0284C7',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    borderRadius: '12px',
                    px: 1,
                    height: 24,
                  }}
                />
              </Box>

              {/* Erro de Compilação se houver */}
              {resultado?.status === 'ERRO_COMPILACAO' && (
                <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <ScienceIcon sx={{ color: '#0284C7', fontSize: 22 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1.05rem' }}>
                Casos de teste visíveis
              </Typography>
            </Box>

            {!hasSubmissoes ? (
              /* Mockup Imagem 1: Tabela Limpa de Casos Visíveis */
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
                          {formatCaseIO(caso.inputs)}
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#0F172A' }}>
                          {formatCaseIO(caso.outputEsperado)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {casosVisiveis.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                          Nenhum caso de teste visível configurado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              /* Mockup Imagem 2: Acordeons de Casos Aprovados/Reprovados */
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {casosVisiveis.map((caso, index) => {
                  const caseKey = caso.uuid || index;
                  const isExpanded = expandedCases[caseKey] ?? true;

                  // Determinar se o caso foi aprovado
                  let aprovado = false;
                  if (resultado?.status === 'AVALIADA' || resultado?.status === 'avaliado') {
                    if (resultado.resultadosCasos && Array.isArray(resultado.resultadosCasos)) {
                      const match = resultado.resultadosCasos.find(
                        (rc) => rc.casoTesteAtividadeUuid === caso.uuid || rc.caso_uuid === caso.uuid
                      );
                      aprovado = match ? match.aprovado : index < casosAprovadosAvaliacao;
                    } else {
                      aprovado = index < casosAprovadosAvaliacao;
                    }
                  }

                  const entradaStr = formatCaseIO(caso.inputs);
                  const esperadoStr = formatCaseIO(caso.outputEsperado);
                  const obtidoStr = aprovado ? esperadoStr : '0';

                  return (
                    <Box
                      key={caseKey}
                      sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: aprovado ? '#BBF7D0' : '#FECACA',
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
                          backgroundColor: aprovado ? '#F0FDF4' : '#FEF2F2',
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

                        {/* Direita: Badge Aprovado/Reprovado + Chevron */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {aprovado ? (
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
                              label="Reprovado"
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
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 2,
                            borderTop: '1px solid',
                            borderColor: aprovado ? '#BBF7D0' : '#FECACA',
                          }}
                        >
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                              Entrada
                            </Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#0F172A' }}>
                              {entradaStr}
                            </Typography>
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
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                color: aprovado ? '#0F172A' : '#DC2626',
                              }}
                            >
                              {obtidoStr}
                            </Typography>
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
            Histórico de tentativas desta função {!hasSubmissoes ? '(0)' : ''}
          </Typography>
        </Box>

        {!hasSubmissoes ? (
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
                  const isAvaliada = tentativa.status === 'AVALIADA' || tentativa.status === 'avaliado';
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
                        {isAvaliada && (
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
                        )}
                        {isErroCompilacao && (
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
                        )}
                        {!isAvaliada && !isErroCompilacao && (
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
                      <TableCell sx={{ fontWeight: 600, color: isErroCompilacao ? '#94A3B8' : '#0F172A' }}>
                        {isErroCompilacao ? '—' : formatScoreDisplay(tentativa.nota, tentativa.notaMaxima || pontosMax)}
                      </TableCell>
                      <TableCell sx={{ color: isErroCompilacao ? '#94A3B8' : '#0F172A', fontWeight: 500 }}>
                        {isErroCompilacao ? '—' : `${tentativa.casosAprovados} / ${tentativa.totalCasos || totalCasosAvaliacao}`}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
                          onClick={() => handleOpenDetalhes(tentativa)}
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

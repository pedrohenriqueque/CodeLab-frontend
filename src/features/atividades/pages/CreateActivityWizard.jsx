/**
 * CreateActivityWizard — Wizard multi-etapas para criar e editar atividades.
 *
 * Etapas:
 *   1. Informações (Título, Descrição, Datas de Abertura/Fechamento, Pontuação Máxima)
 *   2. Funções (Seleção direta da biblioteca, ajuste de dificuldade contextual e pontuação por função)
 *   3. Casos de teste (Seleção individual por caso com toggle interativo de visibilidade Visível / Oculto)
 *   4. Configurações (tipo e regras de submissão)
 *   5. Revisão e Validação (Checklist em tempo real de critérios de validação + Publicação/Rascunho)
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from "@mui/material";

// Ícones Material UI
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SearchIcon from "@mui/icons-material/Search";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import CodeIcon from "@mui/icons-material/Code";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import PublishIcon from "@mui/icons-material/Publish";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";

// Integração com a API do Backend
import {
  createAtividade,
  getAtividade,
  getFuncoesAtividade,
  updateAtividade,
  associarFuncaoAtividade,
  atualizarFuncaoAtividade,
  removerFuncaoAtividade,
  publicarAtividade,
} from "../api";
import { getBibliotecaFuncoes, getCasosTeste, adaptCasoTeste } from "../../funcoes/api";
import { useSnackbar } from "../../../shared/hooks/useSnackbar";
import { useTurmaContext } from "../../turmas/context/TurmaContext";

const STEPS = [
  { id: 1, label: "Informações" },
  { id: 2, label: "Funções" },
  { id: 3, label: "Casos de teste" },
  { id: 4, label: "Configurações" },
  { id: 5, label: "Revisão" },
];

const DIFFICULTIES = [
  { key: "facil", label: "Fácil", color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0" },
  { key: "medio", label: "Médio", color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A" },
  { key: "dificil", label: "Difícil", color: "#EF4444", bg: "#FEF2F2", border: "#FECACA" },
];

function getDifficultyBadge(diff) {
  const norm = (diff || "medio").toLowerCase();
  return (
    DIFFICULTIES.find((d) => d.key === norm) || {
      key: norm,
      label: norm.charAt(0).toUpperCase() + norm.slice(1),
      color: "#6366F1",
      bg: "#EEF2FF",
      border: "#C7D2FE",
    }
  );
}

export default function CreateActivityWizard() {
  const navigate = useNavigate();
  const { uuid } = useParams();
  const { showSuccess, showError } = useSnackbar();
  const { turmaAtiva } = useTurmaContext();

  // Estados principais
  const [step, setStep] = useState(1);
  const [loadingInitial, setLoadingInitial] = useState(!!uuid);
  const [saving, setSaving] = useState(false);
  const [stepErrors, setStepErrors] = useState({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");

  // Estado da biblioteca geral do backend
  const [libraryFunctions, setLibraryFunctions] = useState([]);
  const [loadingLib, setLoadingLib] = useState(true);

  // Form State: Informações
  const [info, setInfo] = useState({
    title: "",
    description: "",
    openDate: "",
    closeDate: "",
    maxPoints: "10",
    tipo: "exercicio",
  });

  // Form State: Funções selecionadas
  // Cada item: { fnId, name, signature, description, difficulty, defaultDifficulty, points, cases: [{ id, numero, inputStr, outputStr, selected, visible }] }
  const [selected, setSelected] = useState([]);

  // Form State: Configurações
  const [config, setConfig] = useState({
    allowMultiple: true,
    maxAttempts: "5",
    bloquearPaste: false,
  });

  // Carregar biblioteca de funções do backend
  const loadLibrary = useCallback(async () => {
    setLoadingLib(true);
    try {
      const data = await getBibliotecaFuncoes();
      const list = Array.isArray(data) ? data : [];
      setLibraryFunctions(list);
      return list;
    } catch {
      showError("Erro ao carregar funções da biblioteca");
      return [];
    } finally {
      setLoadingLib(false);
    }
  }, [showError]);

  // Carregar dados se for edição de atividade existente
  useEffect(() => {
    async function init() {
      const lib = await loadLibrary();

      if (uuid) {
        setLoadingInitial(true);
        try {
          const [ativ, ativFuncoes] = await Promise.all([
            getAtividade(uuid),
            getFuncoesAtividade(uuid).catch(() => []),
          ]);
          if (ativ) {
            if (ativ.status === 'ENCERRADA') {
              showError('Atividades encerradas não podem ser editadas.');
              navigate(`/atividades/${uuid}`, { replace: true });
              return;
            }
            ativ.funcoes = ativFuncoes || [];
            setInfo({
              title: ativ.titulo || "",
              description: ativ.descricao || "",
              openDate: (ativ.inicioEm || ativ.dataAbertura) ? (ativ.inicioEm || ativ.dataAbertura).slice(0, 10) : "",
              closeDate: (ativ.fimEm || ativ.dataFechamento) ? (ativ.fimEm || ativ.dataFechamento).slice(0, 10) : "",
              maxPoints: "10",
              tipo: String(ativ.tipo || "EXERCICIO").toLowerCase(),
            });

            setConfig({
              allowMultiple: ativ.duracaoMinutos === null || ativ.duracaoMinutos === undefined,
              maxAttempts: "5",
              bloquearPaste: ativ.bloquearPaste || false,
            });

            // Mapeia funções vinculadas da atividade
            const mappedSelected = await Promise.all(
              (ativ.funcoes || []).map(async (f) => {
                const fUuid = f.funcaoUuid || f.uuid;
                const libFn = lib.find((item) => item.uuid === fUuid || item.nome === (f.nome || f.nomeFuncao) || item.nomeFuncao === (f.nome || f.nomeFuncao)) || f;
                let canonicalCases = libFn.casosTeste || libFn.casos_teste || f.casosTeste || f.casos_teste || [];

                // Se a função na lib não veio com os casos, busca da API
                if ((!canonicalCases || canonicalCases.length === 0) && libFn.uuid) {
                  try {
                    const fetchedCases = await getCasosTeste(libFn.uuid);
                    if (Array.isArray(fetchedCases) && fetchedCases.length > 0) {
                      canonicalCases = fetchedCases;
                    }
                  } catch (e) {
                    console.error("Erro ao buscar casos canônicos para edição:", e);
                  }
                }

                const assignedCases = f.casosTeste || f.casos_teste || [];
                const assignedUuids = new Set(
                  assignedCases.map((c) => c.casoTesteUuid || c.caso_teste_uuid || c.uuid)
                );

                // Cria mapa de visibilidade para os casos vinculados
                const visibilityMap = new Map();
                assignedCases.forEach((c) => {
                  const cId = c.casoTesteUuid || c.caso_teste_uuid || c.uuid;
                  const isVis = c.visibilidade
                    ? c.visibilidade.toUpperCase() === "VISIVEL"
                    : (c.oculto !== undefined ? !c.oculto : true);
                  visibilityMap.set(cId, isVis);
                });

                // Monta casos combinando os canônicos da biblioteca com os vinculados
                const baseList = canonicalCases.length > 0 ? canonicalCases : assignedCases;
                const cases = baseList.map((rawTc, idx) => {
                  const tc = adaptCasoTeste(rawTc, idx);
                  const tcId = tc.uuid || tc.casoTesteUuid;
                  const isSelected = assignedUuids.size === 0 ? true : assignedUuids.has(tcId);
                  const tcVis = tc.visibilidade ? tc.visibilidade.toUpperCase() === "VISIVEL" : !tc.oculto;
                  const isVisible = visibilityMap.has(tcId) ? visibilityMap.get(tcId) : tcVis;

                  return {
                    id: tcId,
                    numero: tc.numero || idx + 1,
                    inputStr: typeof tc.entradas === "object" ? JSON.stringify(tc.entradas) : String(tc.entradas ?? ""),
                    outputStr:
                      typeof tc.retornoEsperado === "object" && tc.retornoEsperado !== null
                        ? (tc.retornoEsperado?.valor ?? JSON.stringify(tc.retornoEsperado))
                        : String(tc.retornoEsperado ?? ""),
                    selected: isSelected,
                    visible: isVisible,
                    visibilidade: isVisible ? "VISIVEL" : "OCULTO",
                    oculto: !isVisible,
                  };
                });

                return {
                  fnId: libFn.uuid || fUuid,
                  internalId: f.uuid,
                  name: f.nome || f.nomeFuncao || f.nome_funcao || libFn.nome || libFn.nomeFuncao,
                  signature: `${f.nome || f.nomeFuncao || f.nome_funcao || libFn.nome || libFn.nomeFuncao}()`,
                  description: f.descricao || libFn.enunciado || libFn.descricao || "",
                  difficulty: f.dificuldade || libFn.dificuldade || libFn.dificuldadePadrao || "medio",
                  defaultDifficulty: libFn.dificuldade || libFn.dificuldadePadrao || f.dificuldadePadrao || "medio",
                  points: Number(f.notaMaxima || f.peso || 10),
                  cases,
                };
              })
            );

            setSelected(mappedSelected);
          }
        } catch (err) {
          showError(err.response?.data?.detail || "Erro ao carregar dados da atividade");
        } finally {
          setLoadingInitial(false);
        }
      }
    }

    init();
  }, [uuid, loadLibrary, showError]);

  // Funções disponíveis na biblioteca que ainda não foram adicionadas
  const availableToAdd = useMemo(() => {
    const selectedIds = new Set(selected.map((s) => s.fnId));
    return libraryFunctions.filter((f) => !selectedIds.has(f.uuid));
  }, [libraryFunctions, selected]);

  // Filtragem na modal de seleção
  const filteredAvailable = useMemo(() => {
    if (!pickerSearch.trim()) return availableToAdd;
    const q = pickerSearch.toLowerCase();
    return availableToAdd.filter(
      (f) =>
        (f.nome || f.nomeFuncao || f.nome_funcao || "").toLowerCase().includes(q) ||
        (f.enunciado || f.descricao || "").toLowerCase().includes(q)
    );
  }, [availableToAdd, pickerSearch]);

  // Adicionar função da biblioteca à atividade (busca os casos de teste canônicos se necessário)
  const [addingFnId, setAddingFnId] = useState(null);

  const handleAddFunction = async (libFn) => {
    setAddingFnId(libFn.uuid);
    let canonicalCases = libFn.casosTeste || libFn.casos_teste || [];

    // Se a função veio de getBibliotecaFuncoes(), os casos de teste não vêm no array; busca via API
    if (!canonicalCases || canonicalCases.length === 0) {
      try {
        const fetchedCases = await getCasosTeste(libFn.uuid);
        if (Array.isArray(fetchedCases)) {
          canonicalCases = fetchedCases;
        }
      } catch (err) {
        console.error("Erro ao buscar casos de teste da função:", err);
      }
    }

    const cases = (canonicalCases || []).map((rawTc, idx) => {
      const tc = adaptCasoTeste(rawTc, idx);
      // Consulta o verdadeiro estado do caso de teste cadastrado na biblioteca
      const isVisible = tc.visibilidade
        ? tc.visibilidade.toUpperCase() === "VISIVEL"
        : (tc.oculto !== undefined ? !tc.oculto : true);

      return {
        id: tc.uuid || tc.casoTesteUuid,
        numero: tc.numero || idx + 1,
        inputStr: typeof tc.entradas === "object" ? JSON.stringify(tc.entradas) : String(tc.entradas ?? ""),
        outputStr:
          typeof tc.retornoEsperado === "object" && tc.retornoEsperado !== null
            ? (tc.retornoEsperado?.valor ?? JSON.stringify(tc.retornoEsperado))
            : String(tc.retornoEsperado ?? ""),
        selected: true,
        visible: isVisible,
        visibilidade: isVisible ? "VISIVEL" : "OCULTO",
        oculto: !isVisible,
      };
    });

    setSelected((prev) => [
      ...prev,
      {
        fnId: libFn.uuid,
        name: libFn.nome || libFn.nomeFuncao || libFn.nome_funcao,
        signature: `${libFn.nome || libFn.nomeFuncao || libFn.nome_funcao}()`,
        description: libFn.enunciado || libFn.descricao || "",
        difficulty: libFn.dificuldade || libFn.dificuldadePadrao || libFn.dificuldade_padrao || "medio",
        defaultDifficulty: libFn.dificuldade || libFn.dificuldadePadrao || libFn.dificuldade_padrao || "medio",
        points: 10,
        cases,
      },
    ]);
    setAddingFnId(null);
  };

  const handleRemoveFunction = (fnId) => {
    setSelected((prev) => prev.filter((s) => s.fnId !== fnId));
  };

  const updateFn = (fnId, patch) => {
    setSelected((prev) => prev.map((s) => (s.fnId === fnId ? { ...s, ...patch } : s)));
  };

  // Validação das etapas
  const validateStep = (s) => {
    const errors = {};
    if (s === 1) {
      if (!info.title.trim()) errors.title = "O título é obrigatório.";
      if (!info.openDate) errors.openDate = "A data de abertura é obrigatória.";
      if (!info.closeDate) errors.closeDate = "A data de fechamento é obrigatória.";
      if (info.openDate && info.closeDate && info.closeDate <= info.openDate) {
        errors.closeDate = "A data de fechamento deve ser posterior à data de abertura.";
      }
      if (!info.maxPoints || Number(info.maxPoints) < 1) {
        errors.maxPoints = "A pontuação máxima deve ser ao menos 1.";
      }
    }
    if (s === 2) {
      if (selected.length === 0) {
        errors.functions = "Adicione ao menos uma função da biblioteca à atividade.";
      }
      selected.forEach((sf) => {
        if (!sf.points || sf.points <= 0) {
          errors[`pts_${sf.fnId}`] = `${sf.name}: a pontuação deve ser maior que zero.`;
        }
      });
    }
    if (s === 3) {
      selected.forEach((sf) => {
        const chosen = sf.cases.length;
        if (chosen === 0) {
          errors[`cases_${sf.fnId}`] = `${sf.name}: selecione ao menos um caso de teste para avaliação.`;
        }
      });
    }
    return errors;
  };

  const handleNext = () => {
    const errors = validateStep(step);
    setStepErrors(errors);
    if (Object.keys(errors).length > 0) {
      showError("Corrija os erros antes de avançar.");
      return;
    }
    setStepErrors({});
    setStep((prev) => Math.min(prev + 1, 5));
  };

  // Salvar (Rascunho ou Publicação) com sincronização no backend
  const handleSave = async (publish = false) => {
    const allErrors = { ...validateStep(1), ...validateStep(2), ...validateStep(3) };
    if (Object.keys(allErrors).length > 0) {
      setStepErrors(allErrors);
      showError("Preencha todos os campos obrigatórios antes de salvar.");
      return;
    }

    setSaving(true);
    try {
      const payloadAtividade = {
        titulo: info.title.trim(),
        descricao: info.description.trim() || null,
        inicioEm: new Date(info.openDate + "T00:00:00").toISOString(),
        fimEm: new Date(info.closeDate + "T23:59:59").toISOString(),
        tipo: info.tipo === "prova" ? "PROVA" : "EXERCICIO",
        permitirMultiplasSubmissoes: info.tipo === "exercicio" && config.allowMultiple,
        maxTentativasPorFuncao: info.tipo === "exercicio" && config.allowMultiple ? Number(config.maxAttempts) : null,
        mostrarOcultosAposFechamento: false,
      };

      if (!uuid) payloadAtividade.turmaUuid = turmaAtiva.uuid;

      let atividadeTargetUuid = uuid;

      if (uuid) {
        // Atualiza atividade existente
        // O contrato de edição ainda não permite trocar o tipo da atividade.
        // As demais configurações continuam sendo atualizadas.
        const payloadEdicao = { ...payloadAtividade };
        delete payloadEdicao.tipo;
        await updateAtividade(uuid, payloadEdicao);
      } else {
        // Cria nova atividade
        const novaAtiv = await createAtividade(payloadAtividade);
        atividadeTargetUuid = novaAtiv.uuid;
      }

      // Sincroniza funções e casos de teste
      // Se for edição, obtém estado atual para comparar adições, alterações e remoções
      const remoteFns = (await getFuncoesAtividade(atividadeTargetUuid).catch(() => [])) || [];
      const localNames = new Set(selected.map((s) => s.name));
      const localInternalIds = new Set(selected.map((s) => s.internalId).filter(Boolean));

      // 1. Remover funções que foram desassociadas
      for (const rf of remoteFns) {
        if (!localInternalIds.has(rf.uuid) && !localNames.has(rf.nome || rf.nomeFuncao)) {
          await removerFuncaoAtividade(atividadeTargetUuid, rf.uuid);
        }
      }

      // 2. Associar novas ou atualizar existentes
      for (let i = 0; i < selected.length; i++) {
        const sf = selected[i];
        const matchingRemote = remoteFns.find(
          (rf) => (sf.internalId && rf.uuid === sf.internalId) || (rf.nome || rf.nomeFuncao) === sf.name
        );
        if (!matchingRemote) {
          // Associar nova
          await associarFuncaoAtividade(atividadeTargetUuid, {
            funcaoUuid: sf.fnId,
            dificuldade: String(sf.difficulty).toUpperCase(),
            notaMaxima: Number(sf.points),
          });
        } else {
          // Atualizar existente
          await atualizarFuncaoAtividade(atividadeTargetUuid, matchingRemote.uuid, {
            dificuldade: String(sf.difficulty).toUpperCase(),
            notaMaxima: Number(sf.points),
          }).catch(() => {});
        }
      }

      if (publish) await publicarAtividade(atividadeTargetUuid);

      showSuccess(
        publish ? "Atividade publicada com sucesso!" : "Rascunho salvo com sucesso!"
      );
      navigate("/atividades");
    } catch (err) {
      showError(err.response?.data?.detail || "Erro ao salvar atividade.");
    } finally {
      setSaving(false);
    }
  };

  const totalPoints = selected.reduce((sum, s) => sum + (Number(s.points) || 0), 0);
  const firstError = Object.values(stepErrors)[0];

  if (loadingInitial) {
    return (
      <Box sx={{ py: 10, textAlign: "center" }}>
        <CircularProgress sx={{ color: "#4F46E5" }} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Carregando dados da atividade...
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="fade-in" sx={{ maxWidth: 1080, mx: "auto", pb: 8 }}>
      {/* Header Principal */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
          <Tooltip title="Voltar para lista de atividades">
            <IconButton size="small" onClick={() => navigate("/atividades")}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#1E293B" }}>
            {uuid ? "Editar atividade" : "Nova atividade"}
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ ml: 5 }}>
          Monte a atividade selecionando funções reutilizáveis da biblioteca.
        </Typography>
      </Box>

      {/* Stepper Superior Minimalista e Elegante */}
      <Box
        component="nav"
        aria-label="Etapas de criação"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 0.5, sm: 1 },
          mb: 4,
          overflowX: "auto",
          pb: 1,
          borderBottom: "1px solid #E2E8F0",
          pt: 1,
        }}
      >
        {STEPS.map((s, i) => {
          const isActive = step === s.id;
          const isDone = step > s.id;
          const isClickable = isDone;

          return (
            <Box key={s.id} sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              <Box
                component="button"
                type="button"
                onClick={() => isClickable && setStep(s.id)}
                disabled={!isClickable}
                aria-current={isActive ? "step" : undefined}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.2,
                  px: 1.8,
                  py: 1,
                  borderRadius: 2,
                  fontSize: "0.875rem",
                  fontWeight: isActive ? 700 : 500,
                  backgroundColor: isActive ? "#EEF2FF" : "transparent",
                  color: isActive ? "#4F46E5" : isDone ? "#1E293B" : "#94A3B8",
                  border: "none",
                  cursor: isClickable ? "pointer" : "default",
                  transition: "all 0.15s ease",
                  "&:hover": isClickable
                    ? { backgroundColor: "#F8FAFC", color: "#4F46E5" }
                    : {},
                }}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    backgroundColor: isActive
                      ? "#4F46E5"
                      : isDone
                      ? "#10B981"
                      : "#E2E8F0",
                    color: isActive || isDone ? "#FFFFFF" : "#64748B",
                    transition: "all 0.15s",
                  }}
                >
                  {isDone ? <CheckIcon sx={{ fontSize: 14 }} /> : s.id}
                </Box>
                <span>{s.label}</span>
              </Box>

              {i < STEPS.length - 1 && (
                <Box
                  sx={{
                    width: { xs: 16, sm: 32 },
                    height: 2,
                    backgroundColor: isDone ? "#A7F3D0" : "#E2E8F0",
                    mx: 0.5,
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>

      {/* Banner de Validação */}
      {firstError && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            backgroundColor: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 2.5,
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
            color: "#DC2626",
          }}
          role="alert"
        >
          <ErrorOutlineOutlinedIcon sx={{ fontSize: 20, mt: 0.2 }} />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Corrija as pendências antes de avançar:
            </Typography>
            {Object.values(stepErrors).map((e, idx) => (
              <Typography key={idx} variant="caption" sx={{ display: "block" }}>
                • {e}
              </Typography>
            ))}
          </Box>
        </Box>
      )}

      {/* ─── ETAPA 1: Informações ────────────────────────────────────── */}
      {step === 1 && (
        <Card
          variant="outlined"
          sx={{
            borderRadius: 3,
            p: { xs: 2.5, sm: 3.5 },
            backgroundColor: "#FFFFFF",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#1E293B", mb: 0.5 }}>
            Informações da atividade
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Defina o cabeçalho, os prazos de vigência e o critério de pontuação máxima.
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 720 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75, color: "#334155" }}>
                Título <span style={{ color: "#EF4444" }}>*</span>
              </Typography>
              <TextField
                placeholder="Ex: Trabalho 02 — Estruturas Condicionais e Funções"
                value={info.title}
                onChange={(e) => setInfo({ ...info, title: e.target.value })}
                error={!!stepErrors.title}
                helperText={stepErrors.title}
                fullWidth
                size="small"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75, color: "#334155" }}>
                Descrição ou Instruções
              </Typography>
              <TextField
                placeholder="Descreva o objetivo da atividade e instruções para resolução..."
                value={info.description}
                onChange={(e) => setInfo({ ...info, description: e.target.value })}
                fullWidth
                multiline
                rows={3}
                size="small"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75, color: "#334155" }}>
                  Data de abertura <span style={{ color: "#EF4444" }}>*</span>
                </Typography>
                <TextField
                  type="date"
                  value={info.openDate}
                  onChange={(e) => setInfo({ ...info, openDate: e.target.value })}
                  error={!!stepErrors.openDate}
                  helperText={stepErrors.openDate}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75, color: "#334155" }}>
                  Data de fechamento <span style={{ color: "#EF4444" }}>*</span>
                </Typography>
                <TextField
                  type="date"
                  value={info.closeDate}
                  onChange={(e) => setInfo({ ...info, closeDate: e.target.value })}
                  error={!!stepErrors.closeDate}
                  helperText={stepErrors.closeDate}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75, color: "#334155" }}>
                  Nota total da atividade <span style={{ color: "#EF4444" }}>*</span>
                </Typography>
                <TextField
                  type="number"
                  inputProps={{ min: 1, max: 1000 }}
                  value={info.maxPoints}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
                      val = val.replace(/^0+/, '') || '0';
                    }
                    setInfo({ ...info, maxPoints: val });
                  }}
                  error={!!stepErrors.maxPoints}
                  helperText={stepErrors.maxPoints || "Nota total de referência para o cálculo proporcional"}
                  fullWidth
                  size="small"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Box>

            </Box>
          </Box>
        </Card>
      )}

      {/* ─── ETAPA 2: Funções ────────────────────────────────────────── */}
      {step === 2 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Banner explicativo contextual */}
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
              backgroundColor: "#EEF2FF",
              border: "1px solid #C7D2FE",
              borderRadius: 2.5,
              p: 2,
              color: "#3730A3",
            }}
          >
            <InfoOutlinedIcon sx={{ fontSize: 20, mt: 0.2, color: "#4F46E5" }} />
            <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
              Você está <strong>adicionando funções existentes</strong> da biblioteca a esta atividade —
              não criando novas funções. A dificuldade e os casos de teste podem ser ajustados
              apenas para esta atividade sem modificar a biblioteca global.
            </Typography>
          </Box>

          {stepErrors.functions && (
            <Typography variant="body2" sx={{ color: "#DC2626", fontWeight: 600 }}>
              {stepErrors.functions}
            </Typography>
          )}

          {/* Cards das funções já selecionadas */}
          {selected.map((sf, idx) => {
            const isDiffChanged = sf.difficulty !== sf.defaultDifficulty;

            return (
              <Card
                key={sf.fnId}
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  p: 2.5,
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  border: "1px solid #E2E8F0",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 2,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5, flexWrap: "wrap" }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 700, fontFamily: "monospace", color: "#0F172A" }}
                      >
                        {idx + 1}. {sf.signature}
                      </Typography>
                      {isDiffChanged && (
                        <Chip
                          label="Dificuldade ajustada"
                          size="small"
                          sx={{
                            backgroundColor: "#EEF2FF",
                            color: "#4F46E5",
                            fontWeight: 600,
                            fontSize: "0.7rem",
                            height: 20,
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {sf.description || "Função da biblioteca de programação."}
                    </Typography>
                  </Box>

                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleRemoveFunction(sf.fnId)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      flexShrink: 0,
                      "&:hover": { backgroundColor: "#FEF2F2" },
                    }}
                  >
                    Remover
                  </Button>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1.2fr 1fr" },
                    gap: 3,
                    mt: 3,
                    pt: 2.5,
                    borderTop: "1px solid #F1F5F9",
                  }}
                >
                  {/* Seletor de Dificuldade Segmentado */}
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 700, color: "#475569", mb: 1, display: "block" }}
                    >
                      Dificuldade nesta atividade:
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      {DIFFICULTIES.map((d) => {
                        const isChosen = sf.difficulty === d.key;
                        return (
                          <Box
                            key={d.key}
                            component="button"
                            type="button"
                            onClick={() => updateFn(sf.fnId, { difficulty: d.key })}
                            sx={{
                              flex: 1,
                              py: 0.8,
                              px: 1,
                              borderRadius: 2,
                              border: "1.5px solid",
                              borderColor: isChosen ? d.color : "#E2E8F0",
                              backgroundColor: isChosen ? d.bg : "#FFFFFF",
                              color: isChosen ? d.color : "#64748B",
                              fontWeight: isChosen ? 700 : 500,
                              fontSize: "0.8rem",
                              cursor: "pointer",
                              transition: "all 0.15s",
                              "&:hover": { borderColor: d.color },
                            }}
                          >
                            {d.label}
                          </Box>
                        );
                      })}
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                      Padrão original da biblioteca:{" "}
                      <strong>{getDifficultyBadge(sf.defaultDifficulty).label}</strong>
                    </Typography>
                  </Box>

                  {/* Campo de Pontos */}
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 700, color: "#475569", mb: 1, display: "block" }}
                    >
                      Nota máxima nesta atividade:
                    </Typography>
                    <TextField
                      type="number"
                      inputProps={{ min: 0.5, step: 0.5 }}
                      value={sf.points ?? ""}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
                          val = val.replace(/^0+/, '') || '0';
                        }
                        updateFn(sf.fnId, { points: val });
                      }}
                      onBlur={() => {
                        if (sf.points !== "" && !isNaN(Number(sf.points))) {
                          updateFn(sf.fnId, { points: Number(sf.points) });
                        }
                      }}
                      error={!!stepErrors[`pts_${sf.fnId}`]}
                      helperText={stepErrors[`pts_${sf.fnId}`]}
                      size="small"
                      sx={{ maxWidth: 160, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                  </Box>
                </Box>
              </Card>
            );
          })}

          {/* Botão de Adicionar Função */}
          <Box
            component="button"
            type="button"
            onClick={() => setPickerOpen(true)}
            sx={{
              width: "100%",
              py: 3,
              borderRadius: 3,
              border: "2px dashed #CBD5E1",
              backgroundColor: "#FAFAFA",
              color: "#64748B",
              fontWeight: 600,
              fontSize: "0.95rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
              cursor: "pointer",
              transition: "all 0.18s",
              "&:hover": {
                borderColor: "#4F46E5",
                color: "#4F46E5",
                backgroundColor: "#F8FAFC",
              },
            }}
          >
            <AddIcon sx={{ fontSize: 22 }} />
            Adicionar função da biblioteca
          </Box>
        </Box>
      )}

      {/* ─── ETAPA 3: Casos de teste ──────────────────────────────────── */}
      {step === 3 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
              backgroundColor: "#EEF2FF",
              border: "1px solid #C7D2FE",
              borderRadius: 2.5,
              p: 2,
              color: "#3730A3",
            }}
          >
            <InfoOutlinedIcon sx={{ fontSize: 20, mt: 0.2, color: "#4F46E5" }} />
            <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
              Confira os casos de teste que serão copiados para o snapshot desta atividade. Todos os casos cadastrados para a função serão usados; esta tela é apenas de visualização.
            </Typography>
          </Box>

          {selected.map((sf) => {
            const chosenCount = sf.cases.length;
            const visibleCount = sf.cases.filter((c) => c.visible).length;
            const err = stepErrors[`cases_${sf.fnId}`];
            const diffBadge = getDifficultyBadge(sf.difficulty);

            return (
              <Card
                key={sf.fnId}
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  p: 3,
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 700, fontFamily: "monospace", color: "#0F172A" }}
                    >
                      {sf.signature}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {chosenCount} caso{chosenCount !== 1 ? "s" : ""} copiado{chosenCount !== 1 ? "s" : ""} · {visibleCount} visíve{visibleCount !== 1 ? "is" : "l"} · {chosenCount - visibleCount} oculto{chosenCount - visibleCount !== 1 ? "s" : ""}
                    </Typography>
                  </Box>

                  <Chip
                    label={diffBadge.label}
                    size="small"
                    sx={{
                      backgroundColor: diffBadge.bg,
                      color: diffBadge.color,
                      border: `1px solid ${diffBadge.border}`,
                      fontWeight: 700,
                    }}
                  />
                </Box>

                {err && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                    {err}
                  </Alert>
                )}

                {/* Tabela de Casos */}
                {sf.cases.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", py: 2 }}>
                    Esta função não possui casos de teste cadastrados na biblioteca.
                  </Typography>
                ) : (
                  <Box sx={{ overflowX: "auto" }}>
                    <Box
                      component="table"
                      sx={{
                        width: "100%",
                        borderCollapse: "collapse",
                        textAlign: "left",
                        fontSize: "0.85rem",
                      }}
                    >
                      <Box component="thead">
                        <Box component="tr" sx={{ borderBottom: "1.5px solid #E2E8F0" }}>
                          <Box component="th" sx={{ py: 1.5, px: 1.5, width: 60, color: "#64748B" }}>
                            Caso
                          </Box>
                          <Box component="th" sx={{ py: 1.5, px: 1.5, color: "#64748B" }}>
                            Entrada
                          </Box>
                          <Box component="th" sx={{ py: 1.5, px: 1.5, color: "#64748B" }}>
                            Saída esperada
                          </Box>
                          <Box component="th" sx={{ py: 1.5, px: 1.5, width: 140, color: "#64748B" }}>
                            Visibilidade
                          </Box>
                        </Box>
                      </Box>
                      <Box component="tbody">
                        {sf.cases.map((tc, idx) => (
                          <Box
                            component="tr"
                            key={tc.id}
                            sx={{
                              borderBottom: "1px solid #F1F5F9",
                              opacity: 1,
                              backgroundColor: "transparent",
                              transition: "all 0.15s",
                            }}
                          >
<Box component="td" sx={{ py: 1.5, px: 1.5, color: "#64748B", fontWeight: 600 }}>
                              #{idx + 1}
                            </Box>
                            <Box
                              component="td"
                              sx={{
                                py: 1.5,
                                px: 1.5,
                                fontFamily: "monospace",
                                color: "#0F172A",
                                fontSize: "0.8rem",
                              }}
                            >
                              {tc.inputStr || "{}"}
                            </Box>
                            <Box
                              component="td"
                              sx={{
                                py: 1.5,
                                px: 1.5,
                                fontFamily: "monospace",
                                color: "#0F172A",
                                fontWeight: 600,
                                fontSize: "0.8rem",
                              }}
                            >
                              {tc.outputStr || "—"}
                            </Box>
                            <Box component="td" sx={{ py: 1.5, px: 1.5 }}>
                              <Box
                                component="span"
                                sx={{
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: 4,
                                  border: "1px solid",
                                  borderColor: tc.visible ? "#A7F3D0" : "#E2E8F0",
                                  backgroundColor: tc.visible ? "#ECFDF5" : "#F1F5F9",
                                  color: tc.visible ? "#059669" : "#64748B",
                                  cursor: "default",
                                  transition: "all 0.15s",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                }}
                              >
                                {tc.visible ? (
                                  <>
                                    <VisibilityIcon sx={{ fontSize: 14 }} /> Visível
                                  </>
                                ) : (
                                  <>
                                    <VisibilityOffIcon sx={{ fontSize: 14 }} /> Oculto
                                  </>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                )}
              </Card>
            );
          })}
        </Box>
      )}

      {/* ─── ETAPA 4: Configurações ──────────────────────────────────── */}
      {step === 4 && (
        <Card
          variant="outlined"
          sx={{
            borderRadius: 3,
            p: { xs: 2.5, sm: 3.5 },
            backgroundColor: "#FFFFFF",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#1E293B", mb: 0.5 }}>
            Configurações da atividade
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Escolha o tipo e confira as regras aplicáveis aos alunos.
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 640 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
              {[
                { key: "exercicio", title: "Exercício de prática", description: "Permite múltiplas tentativas e oferece feedback para ajudar o aluno a melhorar sua solução." },
                { key: "prova", title: "Trabalho avaliativo", description: "Permite uma única entrega por função e mantém os resultados ocultos para o aluno." },
              ].map((option) => {
                const selectedType = info.tipo === option.key;
                return <Box key={option.key} onClick={() => setInfo({ ...info, tipo: option.key })} sx={{ p: 2, borderRadius: 2, cursor: "pointer", border: "1.5px solid", borderColor: selectedType ? "#4F46E5" : "#E2E8F0", backgroundColor: selectedType ? "#EEF2FF" : "#FFFFFF" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: selectedType ? "#4338CA" : "#1E293B", mb: 0.5 }}>{option.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{option.description}</Typography>
                </Box>;
              })}
            </Box>

            {info.tipo === "exercicio" ? <>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1E293B" }}>Configurações do exercício</Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                py: 2,
                borderBottom: "1px solid #E2E8F0",
              }}
            >
              <Box sx={{ pr: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1E293B" }}>
                  Permitir múltiplas submissões
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  O aluno poderá enviar mais de uma tentativa de código para testar e aprimorar a solução.
                </Typography>
              </Box>
              <Switch
                checked={config.allowMultiple}
                onChange={(e) => setConfig({ ...config, allowMultiple: e.target.checked })}
                color="primary"
              />
            </Box>

            {config.allowMultiple && (
              <Box sx={{ pl: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75, color: "#334155" }}>
                  Número máximo de tentativas por função
                </Typography>
                <TextField
                  type="number"
                  inputProps={{ min: 1, max: 50 }}
                  value={config.maxAttempts}
                  onChange={(e) => setConfig({ ...config, maxAttempts: e.target.value })}
                  size="small"
                  sx={{ maxWidth: 160, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Box>
            )}


            </> : <Box sx={{ p: 2.5, borderRadius: 2, backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1E293B", mb: 2 }}>Regras do trabalho avaliativo</Typography>
              {[
                ["Uma única entrega por função", "O aluno poderá enviar apenas uma solução para cada função da atividade."],
                ["Resultados ocultos para o aluno", "O CodeLab corrige e armazena a nota e os resultados de cada função, sem exibi-los ao aluno durante a atividade."],
                ["Conclusão automática", "A atividade será marcada como concluída quando o aluno tiver enviado uma solução para todas as funções."],
              ].map(([title, description]) => <Box key={title} sx={{ mb: 1.75 }}><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{title}</Typography><Typography variant="body2" color="text.secondary">{description}</Typography></Box>)}
            </Box>}
          </Box>
        </Card>
      )}

      {/* ─── ETAPA 5: Revisão ────────────────────────────────────────── */}
      {step === 5 && (() => {
        const totalUsedCases = selected.reduce(
          (s, sf) => s + sf.cases.length,
          0
        );
        const allFnsHaveCases =
          selected.length > 0 && selected.every((sf) => sf.cases.length > 0);
        const periodValid = !!info.openDate && !!info.closeDate && info.closeDate >= info.openDate;
        const ptsMatch = Math.abs(totalPoints - Number(info.maxPoints || 0)) < 0.01;

        const checks = [
          {
            label: "Informações principais preenchidas",
            ok: !!info.title.trim() && !!info.openDate && !!info.closeDate,
          },
          {
            label: `${selected.length} funç${selected.length !== 1 ? "ões" : "ão"} selecionada${
              selected.length !== 1 ? "s" : ""
            }`,
            ok: selected.length > 0,
          },
          {
            label: `${totalUsedCases} caso${totalUsedCases !== 1 ? "s" : ""} de teste copiado${totalUsedCases !== 1 ? "s" : ""}`,
            ok: totalUsedCases > 0 && allFnsHaveCases,
          },
          { label: "Período de vigência válido", ok: periodValid },
          {
            label: `Soma das notas: ${totalPoints} / 10 pts`,
            ok: ptsMatch,
          },
        ];

        return (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, gap: 3 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Resumo da Atividade */}
              <Card variant="outlined" sx={{ borderRadius: 3, p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1E293B", mb: 2 }}>
                  Resumo da atividade
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2.5,
                    fontSize: "0.875rem",
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Título
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#0F172A", mt: 0.25 }}>
                      {info.title || "—"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Nota máxima
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#0F172A", mt: 0.25 }}>
                      {info.maxPoints} pts
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Abertura
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#0F172A", mt: 0.25 }}>
                      {info.openDate
                        ? new Date(info.openDate + "T12:00:00").toLocaleDateString("pt-BR")
                        : "—"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Fechamento
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#0F172A", mt: 0.25 }}>
                      {info.closeDate
                        ? new Date(info.closeDate + "T12:00:00").toLocaleDateString("pt-BR")
                        : "—"}
                    </Typography>
                  </Box>
                  <Box sx={{ gridColumn: { sm: "span 2" } }}>
                    <Typography variant="caption" color="text.secondary">
                      Tipo e regras
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#0F172A", mt: 0.25 }}>
                      {info.tipo === "prova"
                        ? "Trabalho avaliativo · Uma entrega por função · Resultados ocultos para o aluno · Conclusão automática após o envio de todas as funções"
                        : `Exercício de prática · ${config.allowMultiple ? `Múltiplas tentativas (máximo de ${config.maxAttempts} por função)` : "Uma tentativa por função"}`}
                    </Typography>
                  </Box>
                  {info.description && (
                    <Box sx={{ gridColumn: { sm: "span 2" } }}>
                      <Typography variant="caption" color="text.secondary">
                        Descrição
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#334155", mt: 0.25 }}>
                        {info.description}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Card>

              {/* Lista de Funções */}
              <Card variant="outlined" sx={{ borderRadius: 3, p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1E293B", mb: 2 }}>
                  Funções configuradas ({selected.length})
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {selected.map((sf, idx) => {
                    const chosen = sf.cases.length;
                    const visibleCount = sf.cases.length;
                    const diffBadge = getDifficultyBadge(sf.difficulty);

                    return (
                      <Box
                        key={sf.fnId}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          py: 1.5,
                          px: 2,
                          borderRadius: 2,
                          backgroundColor: "#F8FAFC",
                          border: "1px solid #E2E8F0",
                          gap: 2,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: 1.5,
                              backgroundColor: "#EEF2FF",
                              color: "#4F46E5",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <CodeIcon sx={{ fontSize: 18 }} />
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 700, fontFamily: "monospace", color: "#0F172A" }}
                            >
                              {idx + 1}. {sf.name}()
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {chosen} caso{chosen !== 1 ? "s" : ""} usados · {visibleCount} visíve
                              {visibleCount !== 1 ? "is" : "l"}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                          <Chip
                            label={diffBadge.label}
                            size="small"
                            sx={{
                              backgroundColor: diffBadge.bg,
                              color: diffBadge.color,
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              height: 22,
                            }}
                          />
                          <Chip
                            label={`${sf.points} pts`}
                            size="small"
                            sx={{
                              backgroundColor: "#EEF2FF",
                              color: "#4F46E5",
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              height: 22,
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Card>
            </Box>

            {/* Checklist de Validação Lateral */}
            <Box>
              <Card variant="outlined" sx={{ borderRadius: 3, p: 3, position: "sticky", top: 24 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1E293B", mb: 2 }}>
                  Validação da atividade
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {checks.map((c, i) => (
                    <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          backgroundColor: c.ok ? "#10B981" : "#FEF2F2",
                          color: c.ok ? "#FFFFFF" : "#EF4444",
                          border: c.ok ? "none" : "1px solid #FECACA",
                        }}
                      >
                        {c.ok ? (
                          <CheckIcon sx={{ fontSize: 13 }} />
                        ) : (
                          <CloseIcon sx={{ fontSize: 13 }} />
                        )}
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: c.ok ? 500 : 600,
                          color: c.ok ? "#1E293B" : "#DC2626",
                          fontSize: "0.85rem",
                        }}
                      >
                        {c.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {checks.every((c) => c.ok) ? (
                  <Box
                    sx={{
                      mt: 3,
                      pt: 2.5,
                      borderTop: "1px solid #E2E8F0",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      color: "#10B981",
                    }}
                  >
                    <CheckIcon sx={{ fontSize: 18 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Pronta para ser publicada
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      mt: 3,
                      pt: 2.5,
                      borderTop: "1px solid #E2E8F0",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      color: "#F59E0B",
                    }}
                  >
                    <HelpOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Você ainda pode salvar como rascunho se desejar.
                    </Typography>
                  </Box>
                )}
              </Card>
            </Box>
          </Box>
        );
      })()}

      {/* Barra de Navegação Inferior */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mt: 4,
          pt: 3,
          borderTop: "1px solid #E2E8F0",
        }}
      >
        <Button
          variant="outlined"
          onClick={() => (step > 1 ? setStep(step - 1) : navigate("/atividades"))}
          startIcon={<ArrowBackIcon />}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            borderColor: "#CBD5E1",
            color: "#475569",
            "&:hover": { borderColor: "#94A3B8", backgroundColor: "#F8FAFC" },
          }}
        >
          {step === 1 ? "Cancelar" : "Anterior"}
        </Button>

        <Box sx={{ display: "flex", gap: 1.5 }}>
          {step === 5 ? (
            <>
              <Button
                variant="outlined"
                onClick={() => handleSave(false)}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} /> : <SaveOutlinedIcon />}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: "#CBD5E1",
                  color: "#475569",
                  "&:hover": { borderColor: "#94A3B8" },
                }}
              >
                Salvar rascunho
              </Button>
              <Button
                variant="contained"
                onClick={() => handleSave(true)}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <PublishIcon />}
                sx={{
                  borderRadius: 2,
                  backgroundColor: "#4F46E5",
                  fontWeight: 700,
                  textTransform: "none",
                  px: 3,
                  "&:hover": { backgroundColor: "#4338CA" },
                }}
              >
                {saving ? "Publicando..." : "Publicar atividade"}
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<ArrowForwardIcon />}
              sx={{
                borderRadius: 2,
                backgroundColor: "#4F46E5",
                fontWeight: 700,
                textTransform: "none",
                px: 3,
                "&:hover": { backgroundColor: "#4338CA" },
              }}
            >
              Próximo
            </Button>
          )}
        </Box>
      </Box>

      {/* Modal / Dialog de Seleção de Função da Biblioteca */}
      <Dialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#1E293B", pb: 1 }}>
          Adicionar função da biblioteca
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Selecione uma função existente cadastrada na biblioteca para compor a atividade.
          </Typography>

          <TextField
            placeholder="Pesquisar função por nome ou descrição..."
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            fullWidth
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2.5, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />

          {loadingLib ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <CircularProgress size={28} sx={{ color: "#4F46E5" }} />
            </Box>
          ) : availableToAdd.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 5 }}>
              <Typography variant="body2" color="text.secondary">
                Todas as funções da biblioteca já foram adicionadas a esta atividade.
              </Typography>
              <Button
                component={Link}
                to="/funcoes"
                variant="text"
                sx={{ textTransform: "none", fontWeight: 600, mt: 1, color: "#4F46E5" }}
              >
                Criar nova função na biblioteca →
              </Button>
            </Box>
          ) : filteredAvailable.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Nenhuma função encontrada com o termo "{pickerSearch}".
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, maxHeight: 380, overflowY: "auto", pr: 0.5 }}>
              {filteredAvailable.map((fn) => {
                const diff = getDifficultyBadge(fn.dificuldade || fn.dificuldadePadrao || fn.dificuldade_padrao);
                const testCasesCount =
                  fn.totalCasosTeste ??
                  fn.total_casos_teste ??
                  (fn.casosTeste || fn.casos_teste || []).length;
                const isAddingThis = addingFnId === fn.uuid;

                return (
                  <Box
                    key={fn.uuid}
                    component="button"
                    type="button"
                    disabled={isAddingThis}
                    onClick={async () => {
                      await handleAddFunction(fn);
                      if (availableToAdd.length === 1) setPickerOpen(false);
                    }}
                    sx={{
                      width: "100%",
                      p: 2,
                      borderRadius: 2.5,
                      border: "1.5px solid #E2E8F0",
                      backgroundColor: "#FFFFFF",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: isAddingThis ? "wait" : "pointer",
                      opacity: isAddingThis ? 0.7 : 1,
                      transition: "all 0.15s",
                      "&:hover": {
                        borderColor: "#4F46E5",
                        backgroundColor: "#F8FAFC",
                      },
                    }}
                  >
                    <Box sx={{ minWidth: 0, pr: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700, fontFamily: "monospace", color: "#0F172A" }}
                        >
                          {fn.nome || fn.nomeFuncao || fn.nome_funcao}()
                        </Typography>
                        <Chip
                          label={diff.label}
                          size="small"
                          sx={{
                            backgroundColor: diff.bg,
                            color: diff.color,
                            fontWeight: 700,
                            fontSize: "0.7rem",
                            height: 20,
                          }}
                        />
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {fn.enunciado || fn.descricao || "Sem descrição"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748B", display: "block", mt: 0.5 }}>
                        {testCasesCount} casos de teste cadastrados
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        color: "#4F46E5",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        flexShrink: 0,
                      }}
                    >
                      {isAddingThis ? (
                        <>
                          <CircularProgress size={16} sx={{ color: "#4F46E5" }} />
                          <Typography variant="caption" sx={{ color: "#4F46E5", fontWeight: 700 }}>
                            Carregando...
                          </Typography>
                        </>
                      ) : (
                        <>
                          <AddIcon sx={{ fontSize: 18 }} />
                          Adicionar
                        </>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: "space-between" }}>
          <Button
            component={Link}
            to="/funcoes"
            sx={{ textTransform: "none", fontSize: "0.8rem", color: "#64748B" }}
          >
            Precisa de outra função? Ir para a biblioteca →
          </Button>
          <Button
            variant="contained"
            onClick={() => setPickerOpen(false)}
            sx={{
              borderRadius: 2,
              backgroundColor: "#1E293B",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { backgroundColor: "#0F172A" },
            }}
          >
            Concluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

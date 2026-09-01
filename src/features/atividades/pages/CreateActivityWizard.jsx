/**
 * CreateActivityWizard — Wizard multi-etapas para criar atividades.
 *
 * Etapas:
 *   1. Informações gerais (título, descrição, tipo)
 *   2. Funções da atividade
 *   3. Casos de teste (por função)
 *   4. Configurações (visibilidade dos testes, submissões)
 *   5. Revisão e publicação
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FunctionsIcon from '@mui/icons-material/Functions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DataObjectIcon from '@mui/icons-material/DataObject';
import CodeIcon from '@mui/icons-material/Code';
import PublishIcon from '@mui/icons-material/Publish';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import {
  createAtividade,
  getAtividade,
  getFuncoes,
  createFuncao,
  updateFuncao,
  deleteFuncao,
  getCasosTeste,
  createCasosTeste,
  updateAtividade,
} from '../api';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Informações' },
  { label: 'Funções' },
  { label: 'Casos de teste' },
  { label: 'Configurações' },
  { label: 'Revisão' },
];

const C_TYPES = ['int', 'float', 'double', 'char', 'char*', 'void', 'long'];

// ─── Stepper ─────────────────────────────────────────────────────────────────

function WizardStepper({ currentStep }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1, sm: 2 },
        mb: 4,
        flexWrap: 'wrap',
      }}
    >
      {STEPS.map((step, idx) => {
        const stepNum = idx + 1;
        const isActive = currentStep === stepNum;
        const isDone = currentStep > stepNum;

        return (
          <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'default',
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  backgroundColor: isActive
                    ? '#2D3282'
                    : isDone
                    ? '#E8EAF6'
                    : 'transparent',
                  color: isActive ? '#fff' : isDone ? '#2D3282' : '#8A92A6',
                  border: isActive
                    ? 'none'
                    : isDone
                    ? 'none'
                    : '1.5px solid #CBD5E1',
                  flexShrink: 0,
                }}
              >
                {isDone ? <CheckCircleIcon sx={{ fontSize: 16, color: '#2D3282' }} /> : stepNum}
              </Box>
              <Typography
                sx={{
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#2D3282' : isDone ? '#2D3282' : '#8A92A6',
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                {step.label}
              </Typography>
            </Box>

            {idx < STEPS.length - 1 && (
              <Box
                sx={{
                  width: { xs: 12, sm: 24 },
                  height: 1,
                  backgroundColor: '#E2E8F0',
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

// ─── Step 1: Informações ─────────────────────────────────────────────────────

function StepInformacoes({ data, onChange, onNext }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 540 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: '#1E293B' }}>
        Informações gerais
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2.5 }}>
        {/* Título */}
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75, color: '#334155' }}>
            Título da atividade
          </Typography>
          <TextField
            id="wizard-titulo"
            value={data.titulo}
            onChange={(e) => onChange({ titulo: e.target.value })}
            required
            fullWidth
            placeholder="Ex: Trabalho 02 – Funções"
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </Box>

        {/* Descrição */}
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75, color: '#334155' }}>
            Descrição
          </Typography>
          <TextField
            id="wizard-descricao"
            value={data.descricao}
            onChange={(e) => onChange({ descricao: e.target.value })}
            fullWidth
            multiline
            rows={4}
            placeholder="Descreva o objetivo da atividade..."
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </Box>

        {/* Tipo da atividade */}
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#334155' }}>
            Tipo da atividade
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            {[
              {
                value: 'exercicio',
                title: 'Exercício de prática',
                desc: 'Atividade para treino e fixação de conteúdo.',
              },
              {
                value: 'prova',
                title: 'Trabalho avaliativo',
                desc: 'Atividade que compõe a nota do aluno.',
              },
            ].map((opt) => {
              const selected = data.tipo === opt.value;
              return (
                <Box
                  key={opt.value}
                  onClick={() => onChange({ tipo: opt.value })}
                  sx={{
                    p: 2,
                    border: '1.5px solid',
                    borderColor: selected ? '#2D3282' : '#E2E8F0',
                    borderRadius: 2.5,
                    cursor: 'pointer',
                    backgroundColor: selected ? '#F0F2F9' : '#fff',
                    transition: 'all 0.18s',
                    '&:hover': { borderColor: '#2D3282' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Box
                      sx={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        border: '2px solid',
                        borderColor: selected ? '#2D3282' : '#94A3B8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {selected && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: '#2D3282',
                          }}
                        />
                      )}
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, color: selected ? '#2D3282' : '#1E293B' }}
                    >
                      {opt.title}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', pl: 3.25, lineHeight: 1.4 }}
                  >
                    {opt.desc}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Data de fechamento */}
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75, color: '#334155' }}>
            Data de fechamento (opcional)
          </Typography>
          <TextField
            id="wizard-fechamento"
            type="datetime-local"
            value={data.dataFechamento}
            onChange={(e) => onChange({ dataFechamento: e.target.value })}
            fullWidth
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
        <Button
          id="wizard-step1-continuar"
          type="submit"
          variant="contained"
          disabled={!data.titulo.trim()}
          sx={{
            minWidth: 140,
            py: 1,
            borderRadius: 2,
            backgroundColor: '#2D3282',
            '&:hover': { backgroundColor: '#1E2260' },
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Continuar
        </Button>
      </Box>
    </Box>
  );
}

// ─── FuncaoFormDialog ────────────────────────────────────────────────────────

function FuncaoFormDialog({ open, onClose, onSave, initialData }) {
  const INITIAL = {
    nomeFuncao: '',
    descricao: '',
    pontos: 4,
    retorno: 'int',
    dificuldade: 'medio',
    parametros: [{ nome: 'n', tipo: 'int' }],
  };

  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          nomeFuncao: initialData.nomeFuncao || initialData.nome_funcao || '',
          descricao: initialData.descricao || '',
          pontos: initialData.pontos !== undefined ? initialData.pontos : 4,
          retorno: initialData.retorno?.tipo || initialData.retorno || 'int',
          dificuldade: initialData.dificuldade || 'medio',
          parametros: initialData.parametros?.length
            ? initialData.parametros.map((p) => ({ nome: p.nome, tipo: p.tipo }))
            : [{ nome: 'n', tipo: 'int' }],
        });
      } else {
        setForm(INITIAL);
      }
    }
  }, [open, initialData]);

  const nameValid = !form.nomeFuncao || /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(form.nomeFuncao.trim());

  const doSave = async () => {
    if (!form.nomeFuncao.trim() || !nameValid) return;
    setSaving(true);
    try {
      await onSave({
        nomeFuncao: form.nomeFuncao.trim(),
        descricao: form.descricao?.trim() || null,
        pontos: Number(form.pontos) || 0,
        retorno: { tipo: form.retorno },
        dificuldade: form.dificuldade,
        dicas: [],
        parametros: form.parametros.filter((p) => p.nome && p.nome.trim()),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await doSave();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit,
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1, color: '#1E293B' }}>
        {initialData ? 'Editar Função' : 'Adicionar Função'}
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: '#E2E8F0' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <TextField
            label="Nome da Função"
            value={form.nomeFuncao}
            onChange={(e) => setForm((p) => ({ ...p, nomeFuncao: e.target.value }))}
            required
            fullWidth
            autoFocus
            placeholder="ex: fatorial"
            error={form.nomeFuncao.length > 0 && !nameValid}
            helperText={
              form.nomeFuncao.length > 0 && !nameValid
                ? 'Identificador C válido (ex: fatorial, soma_array)'
                : ''
            }
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          <TextField
            label="Descrição"
            value={form.descricao}
            onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
            fullWidth
            multiline
            rows={2}
            placeholder="O que a função deve fazer..."
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
            <TextField
              label="Pontos"
              type="number"
              value={form.pontos}
              onChange={(e) => setForm((p) => ({ ...p, pontos: e.target.value }))}
              inputProps={{ min: 0, step: 0.5 }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Retorno"
              select
              value={form.retorno}
              onChange={(e) => setForm((p) => ({ ...p, retorno: e.target.value }))}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            >
              {C_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Dificuldade"
              select
              value={form.dificuldade}
              onChange={(e) => setForm((p) => ({ ...p, dificuldade: e.target.value }))}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            >
              <MenuItem value="facil">Fácil</MenuItem>
              <MenuItem value="medio">Médio</MenuItem>
              <MenuItem value="dificil">Difícil</MenuItem>
            </TextField>
          </Box>

          {/* Parâmetros */}
          <Box>
            <Box
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155' }}>
                Parâmetros
              </Typography>
              <Button
                size="small"
                startIcon={<AddCircleIcon />}
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    parametros: [...p.parametros, { nome: '', tipo: 'int' }],
                  }))
                }
                sx={{ textTransform: 'none', color: '#2D3282', fontWeight: 600 }}
              >
                Adicionar
              </Button>
            </Box>
            {form.parametros.map((param, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                <TextField
                  label="Nome"
                  value={param.nome}
                  onChange={(e) =>
                    setForm((p) => {
                      const ps = [...p.parametros];
                      ps[idx] = { ...ps[idx], nome: e.target.value };
                      return { ...p, parametros: ps };
                    })
                  }
                  size="small"
                  sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  placeholder="ex: n"
                />
                <TextField
                  label="Tipo"
                  select
                  value={param.tipo}
                  onChange={(e) =>
                    setForm((p) => {
                      const ps = [...p.parametros];
                      ps[idx] = { ...ps[idx], tipo: e.target.value };
                      return { ...p, parametros: ps };
                    })
                  }
                  size="small"
                  sx={{ width: 110, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                >
                  {C_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </TextField>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      parametros: p.parametros.filter((_, i) => i !== idx),
                    }))
                  }
                  disabled={form.parametros.length <= 1}
                >
                  <RemoveCircleIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>

          {/* Preview */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}
            >
              Assinatura C:
            </Typography>
            <code style={{ color: '#0F172A', fontWeight: 600 }}>
              {form.retorno} {form.nomeFuncao.trim() || '???'}(
              {form.parametros
                .filter((p) => p.nome && p.nome.trim())
                .map((p) => `${p.tipo} ${p.nome.trim()}`)
                .join(', ')}
              )
            </code>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none' }}>
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={doSave}
          variant="contained"
          disabled={saving || !form.nomeFuncao.trim() || !nameValid}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{
            backgroundColor: '#2D3282',
            '&:hover': { backgroundColor: '#1E2260' },
            textTransform: 'none',
            borderRadius: 2,
            px: 3,
          }}
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Step 2: Funções ─────────────────────────────────────────────────────────

function StepFuncoes({ atividadeUuid, funcoes, onFuncaoAdded, onBack, onNext }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFuncao, setEditingFuncao] = useState(null);
  const { showSuccess, showError } = useSnackbar();

  const handleSave = async (data) => {
    try {
      if (editingFuncao?.uuid) {
        await updateFuncao(editingFuncao.uuid, data);
        showSuccess('Função atualizada!');
      } else {
        await createFuncao(atividadeUuid, data);
        showSuccess('Função adicionada!');
      }
      await onFuncaoAdded();
      setDialogOpen(false);
      setEditingFuncao(null);
    } catch (err) {
      showError(err.response?.data?.detail || 'Erro ao salvar função');
      throw err;
    }
  };

  const handleDelete = async (funcaoUuid) => {
    try {
      await deleteFuncao(funcaoUuid);
      showSuccess('Função removida com sucesso!');
      await onFuncaoAdded();
    } catch (err) {
      showError(err.response?.data?.detail || 'Erro ao remover função');
    }
  };

  const paramLabel = (params = []) => {
    if (!params || !params.length) return '—';
    return params.map((p) => `${p.nome} : ${p.tipo}`).join(', ');
  };

  return (
    <Box sx={{ maxWidth: 640 }}>
      {/* Header da etapa */}
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B' }}>
            Funções da atividade
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Adicione as funções que o aluno deverá implementar.
          </Typography>
        </Box>
        <Button
          id="wizard-add-funcao"
          variant="outlined"
          startIcon={<AddIcon />}
          size="small"
          onClick={() => {
            setEditingFuncao(null);
            setDialogOpen(true);
          }}
          sx={{
            flexShrink: 0,
            textTransform: 'none',
            borderRadius: 2,
            borderColor: '#2D3282',
            color: '#2D3282',
            fontWeight: 600,
            '&:hover': {
              borderColor: '#1E2260',
              backgroundColor: 'rgba(45, 50, 130, 0.04)',
            },
          }}
        >
          + Adicionar função
        </Button>
      </Box>

      {/* Lista de funções */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
        {funcoes.length === 0 ? (
          <Box
            sx={{
              border: '2px dashed #CBD5E1',
              borderRadius: 3,
              py: 6,
              textAlign: 'center',
              backgroundColor: '#FAFCFF',
            }}
          >
            <FunctionsIcon sx={{ fontSize: 44, color: '#94A3B8', mb: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Nenhuma função adicionada ainda.
            </Typography>
            <Button
              variant="text"
              size="small"
              onClick={() => {
                setEditingFuncao(null);
                setDialogOpen(true);
              }}
              sx={{ mt: 1, textTransform: 'none', color: '#2D3282', fontWeight: 600 }}
            >
              + Adicionar primeira função
            </Button>
          </Box>
        ) : (
          funcoes.map((fn) => (
            <Card
              key={fn.uuid}
              sx={{
                borderRadius: 3,
                border: '1.5px solid #EDF2F7',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  borderColor: '#CBD5E1',
                },
              }}
            >
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  {/* Ícone Roxinho */}
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#EEF2FF',
                      color: '#4F46E5',
                      flexShrink: 0,
                    }}
                  >
                    <DataObjectIcon sx={{ fontSize: 22 }} />
                  </Box>

                  {/* Detalhes da função */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 700,
                        color: '#0F172A',
                        fontSize: '1rem',
                        fontFamily: 'monospace',
                      }}
                    >
                      {fn.nomeFuncao || fn.nome_funcao}
                    </Typography>
                    {fn.descricao && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.25, mb: 2, fontSize: '0.85rem' }}
                      >
                        {fn.descricao}
                      </Typography>
                    )}

                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 2,
                        mt: fn.descricao ? 0 : 1.5,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ fontWeight: 600, fontSize: '0.75rem', mb: 0.25 }}
                        >
                          Parâmetro
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: 'monospace',
                            color: '#1E293B',
                            fontWeight: 600,
                            fontSize: '0.82rem',
                          }}
                        >
                          {paramLabel(fn.parametros)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ fontWeight: 600, fontSize: '0.75rem', mb: 0.25 }}
                        >
                          Retorno
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: 'monospace',
                            color: '#1E293B',
                            fontWeight: 600,
                            fontSize: '0.82rem',
                          }}
                        >
                          {fn.retorno?.tipo || fn.retorno || '—'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ fontWeight: 600, fontSize: '0.75rem', mb: 0.25 }}
                        >
                          Pontuação
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: '#0F172A', fontWeight: 700, fontSize: '0.85rem' }}
                        >
                          {Number(fn.pontos).toFixed(1).replace('.', ',')} pontos
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Ações: Editar e Excluir */}
                  <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingFuncao(fn);
                          setDialogOpen(true);
                        }}
                        sx={{
                          border: '1px solid #E2E8F0',
                          borderRadius: 2,
                          color: '#475569',
                          '&:hover': { backgroundColor: '#F1F5F9' },
                        }}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remover">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(fn.uuid)}
                        sx={{
                          border: '1px solid #FEE2E2',
                          borderRadius: 2,
                          color: '#EF4444',
                          '&:hover': { backgroundColor: '#FEF2F2' },
                        }}
                      >
                        <DeleteOutlineOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      {/* Botões de Rodapé */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5 }}>
        <Button
          variant="outlined"
          onClick={onBack}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            color: '#475569',
            borderColor: '#CBD5E1',
            px: 3,
            fontWeight: 600,
            '&:hover': { borderColor: '#94A3B8' },
          }}
        >
          Voltar
        </Button>
        <Button
          id="wizard-step2-continuar"
          variant="contained"
          onClick={onNext}
          disabled={funcoes.length === 0}
          sx={{
            borderRadius: 2,
            backgroundColor: '#2D3282',
            '&:hover': { backgroundColor: '#1E2260' },
            textTransform: 'none',
            px: 4,
            fontWeight: 600,
            minWidth: 130,
          }}
        >
          Continuar
        </Button>
      </Box>

      {/* Modal Dialog */}
      <FuncaoFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingFuncao(null);
        }}
        onSave={handleSave}
        initialData={editingFuncao}
      />
    </Box>
  );
}

// ─── CasoTesteRow ────────────────────────────────────────────────────────────

function CasoTesteRow({ caso, numero, parametros }) {
  const inputStr = parametros.length
    ? parametros.map((p) => String(caso.inputs?.[p.nome] ?? '')).join(', ')
    : JSON.stringify(caso.inputs ?? {});

  const outputStr =
    typeof caso.outputEsperado === 'object'
      ? String(caso.outputEsperado?.valor ?? JSON.stringify(caso.outputEsperado))
      : String(caso.outputEsperado ?? '');

  const visivel = caso.visivel !== false;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr 1fr 80px 80px',
        gap: 1,
        alignItems: 'center',
        px: 1.5,
        py: 1,
        borderBottom: '1px solid #E2E8F0',
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {numero}
      </Typography>
      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
        {inputStr}
      </Typography>
      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
        {outputStr}
      </Typography>
      <Chip
        label={visivel ? 'Visível' : 'Oculto'}
        size="small"
        sx={{
          fontSize: '0.7rem',
          fontWeight: 600,
          backgroundColor: visivel ? '#DCFCE7' : '#FEF3C7',
          color: visivel ? '#16A34A' : '#D97706',
          border: 'none',
        }}
      />
      <Box sx={{ display: 'flex', gap: 0.25 }}>
        <IconButton size="small" disabled>
          <EditOutlinedIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" color="error" disabled>
          <DeleteOutlineOutlinedIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}

// ─── AddCasoDialog ────────────────────────────────────────────────────────────

function AddCasoDialog({ open, onClose, onSave, funcao }) {
  const params = funcao?.parametros || [];
  const [inputs, setInputs] = useState({});
  const [output, setOutput] = useState('');
  const [visivel, setVisivel] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const init = {};
      params.forEach((p) => (init[p.nome] = ''));
      setInputs(init);
      setOutput('');
      setVisivel(true);
    }
  }, [open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const parsedInputs = {};
      params.forEach((p) => {
        const raw = (inputs[p.nome] || '').trim();
        const tipo = p.tipo || 'int';

        if (tipo.endsWith('[]')) {
          // Tratar vetores: suporta [7.5, 8.0, 9.0] ou 7.5, 8.0, 9.0
          try {
            if (raw.startsWith('[') && raw.endsWith(']')) {
              parsedInputs[p.nome] = JSON.parse(raw);
            } else if (raw) {
              const baseTipo = tipo.slice(0, -2);
              parsedInputs[p.nome] = raw.split(',').map((item) => {
                const trimmed = item.trim();
                const n = Number(trimmed);
                return baseTipo === 'float' || baseTipo === 'double' || baseTipo === 'int'
                  ? (isNaN(n) ? trimmed : n)
                  : trimmed;
              });
            } else {
              parsedInputs[p.nome] = [];
            }
          } catch {
            parsedInputs[p.nome] = raw.split(',').map((x) => x.trim());
          }
        } else {
          const n = Number(raw);
          parsedInputs[p.nome] = isNaN(n) || raw === '' ? raw : n;
        }
      });

      const outRaw = output.trim();
      const outNum = Number(outRaw);
      const outVal = isNaN(outNum) || outRaw === '' ? outRaw : outNum;

      await onSave({
        inputs: parsedInputs,
        outputEsperado: { valor: outVal },
        visivel,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700, color: '#1E293B' }}>Novo Caso de Teste</DialogTitle>
      <DialogContent dividers sx={{ borderColor: '#E2E8F0' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {params.map((p) => (
            <TextField
              key={p.nome}
              label={`${p.nome} (${p.tipo})`}
              value={inputs[p.nome] || ''}
              onChange={(e) => setInputs((prev) => ({ ...prev, [p.nome]: e.target.value }))}
              placeholder={p.tipo.endsWith('[]') ? '[7.5, 8.0, 9.0] ou 7.5, 8.0, 9.0' : 'ex: 3'}
              helperText={p.tipo.endsWith('[]') ? 'Digite os valores separados por vírgula ou em colchetes [ ]' : ''}
              fullWidth
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          ))}
          <TextField
            label="Saída esperada"
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            fullWidth
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={visivel}
                onChange={(e) => setVisivel(e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography variant="body2">
                {visivel ? 'Visível para o aluno' : 'Oculto para o aluno'}
              </Typography>
            }
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none' }}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || !output}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{
            backgroundColor: '#2D3282',
            '&:hover': { backgroundColor: '#1E2260' },
            textTransform: 'none',
            borderRadius: 2,
            px: 3,
          }}
        >
          {saving ? 'Salvando...' : 'Adicionar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Step 3: Casos de Teste ───────────────────────────────────────────────────

function StepCasosTeste({ funcoes, onBack, onNext }) {
  const [selectedFuncaoUuid, setSelectedFuncaoUuid] = useState(funcoes[0]?.uuid || '');
  const [casos, setCasos] = useState({});
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const { showSuccess, showError } = useSnackbar();

  const selectedFuncao = funcoes.find((f) => f.uuid === selectedFuncaoUuid);

  const fetchCasos = useCallback(async () => {
    if (!selectedFuncaoUuid) return;
    setLoading(true);
    try {
      const data = await getCasosTeste(selectedFuncaoUuid);
      setCasos((prev) => ({ ...prev, [selectedFuncaoUuid]: Array.isArray(data) ? data : [data] }));
    } catch {
      setCasos((prev) => ({ ...prev, [selectedFuncaoUuid]: [] }));
    } finally {
      setLoading(false);
    }
  }, [selectedFuncaoUuid]);

  useEffect(() => {
    fetchCasos();
  }, [fetchCasos]);

  const handleAddCaso = async (data) => {
    try {
      await createCasosTeste(selectedFuncaoUuid, data);
      showSuccess('Caso de teste adicionado!');
      fetchCasos();
    } catch (err) {
      showError(err.response?.data?.detail || 'Erro ao adicionar caso');
      throw err;
    }
  };

  const casosList = casos[selectedFuncaoUuid] || [];
  const totalCasos = Object.values(casos).reduce((acc, list) => acc + (list?.length || 0), 0);

  return (
    <Box sx={{ maxWidth: 700 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1E293B' }}>
        Casos de teste
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Sidebar: seletor de função */}
        <Box
          sx={{
            width: 190,
            flexShrink: 0,
            border: '1.5px solid #EDF2F7',
            borderRadius: 3,
            overflow: 'hidden',
            backgroundColor: '#fff',
          }}
        >
          <Box sx={{ px: 2, py: 1.25, backgroundColor: '#F8FAFC', borderBottom: '1px solid #EDF2F7' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B' }}>
              Função selecionada
            </Typography>
          </Box>
          {funcoes.map((fn) => (
            <Box
              key={fn.uuid}
              onClick={() => setSelectedFuncaoUuid(fn.uuid)}
              sx={{
                px: 2,
                py: 1.5,
                cursor: 'pointer',
                backgroundColor:
                  selectedFuncaoUuid === fn.uuid ? '#F0F2F9' : 'transparent',
                borderLeft: '3px solid',
                borderColor:
                  selectedFuncaoUuid === fn.uuid ? '#2D3282' : 'transparent',
                '&:hover': { backgroundColor: '#F8FAFC' },
                transition: 'all 0.15s',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: selectedFuncaoUuid === fn.uuid ? 700 : 600,
                  color: selectedFuncaoUuid === fn.uuid ? '#2D3282' : '#1E293B',
                }}
              >
                {fn.nomeFuncao || fn.nome_funcao}
              </Typography>
              {fn.descricao && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 160,
                    mt: 0.25,
                  }}
                >
                  {fn.descricao}
                </Typography>
              )}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {(fn.parametros || []).map((p) => (
                  <Typography
                    key={p.nome}
                    variant="caption"
                    sx={{ fontFamily: 'monospace', color: '#64748B' }}
                  >
                    {p.nome}: {p.tipo}
                  </Typography>
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Retorno: {fn.retorno?.tipo || fn.retorno || '—'}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155' }} display="block">
                Pontos: {fn.pontos}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#2D3282' }} display="block">
                Total de casos: {(casos[fn.uuid] || []).length}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Main: tabela de casos */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1.5,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>
              Casos de teste
            </Typography>
            <Button
              id="wizard-add-caso"
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setAddOpen(true)}
              disabled={!selectedFuncao}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                borderColor: '#2D3282',
                color: '#2D3282',
                fontWeight: 600,
              }}
            >
              Adicionar caso
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
            Defina os casos que serão utilizados na avaliação.
          </Typography>

          <Card variant="outlined" sx={{ borderRadius: 2.5, borderColor: '#E2E8F0' }}>
            {/* Header da tabela */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr 1fr 80px 80px',
                gap: 1,
                px: 1.5,
                py: 1,
                backgroundColor: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              {['#', 'Entrada', 'Saída esperada', 'Visibilidade', 'Ações'].map((h) => (
                <Typography key={h} variant="caption" sx={{ fontWeight: 700, color: '#64748B' }}>
                  {h}
                </Typography>
              ))}
            </Box>

            {loading ? (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <CircularProgress size={24} />
              </Box>
            ) : casosList.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Nenhum caso de teste adicionado.
                </Typography>
              </Box>
            ) : (
              casosList.map((caso, idx) => (
                <CasoTesteRow
                  key={caso.uuid || idx}
                  caso={caso}
                  numero={caso.numero ?? idx + 1}
                  parametros={selectedFuncao?.parametros || []}
                />
              ))
            )}
          </Card>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5 }}>
        <Button
          variant="outlined"
          onClick={onBack}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            color: '#475569',
            borderColor: '#CBD5E1',
            px: 3,
            fontWeight: 600,
          }}
        >
          Voltar
        </Button>
        <Button
          id="wizard-step3-continuar"
          variant="contained"
          onClick={onNext}
          disabled={totalCasos === 0}
          sx={{
            borderRadius: 2,
            backgroundColor: '#2D3282',
            '&:hover': { backgroundColor: '#1E2260' },
            textTransform: 'none',
            px: 4,
            fontWeight: 600,
            minWidth: 130,
          }}
        >
          Continuar
        </Button>
      </Box>

      <AddCasoDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleAddCaso}
        funcao={selectedFuncao}
      />
    </Box>
  );
}

// ─── Step 4: Configurações ────────────────────────────────────────────────────

function StepConfiguracoes({ config, onChange, onBack, onNext }) {
  return (
    <Box sx={{ maxWidth: 700 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#1E293B' }}>
        Configurações da atividade
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* Visibilidade dos casos */}
        <Card sx={{ borderRadius: 3, border: '1.5px solid #EDF2F7' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: '#1E293B' }}>
              Visibilidade dos casos de teste
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              Escolha se os casos serão apresentados ao aluno.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[
                {
                  value: true,
                  icon: <VisibilityIcon sx={{ fontSize: 18, color: '#2D3282' }} />,
                  title: 'Testes visíveis',
                  desc: 'Os alunos poderão ver todos os dados antes de enviar a solução.',
                },
                {
                  value: false,
                  icon: <VisibilityOffIcon sx={{ fontSize: 18, color: '#D97706' }} />,
                  title: 'Testes ocultos',
                  desc: 'Os alunos não verão os dados de teste antes de enviar a solução.',
                },
              ].map((opt) => {
                const selected = config.testesVisiveis === opt.value;
                return (
                  <Box
                    key={String(opt.value)}
                    onClick={() => onChange({ testesVisiveis: opt.value })}
                    sx={{
                      p: 1.75,
                      border: '1.5px solid',
                      borderColor: selected ? '#2D3282' : '#E2E8F0',
                      borderRadius: 2.5,
                      cursor: 'pointer',
                      backgroundColor: selected ? '#F0F2F9' : '#fff',
                      transition: 'all 0.18s',
                      '&:hover': { borderColor: '#2D3282' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      {opt.icon}
                      <Typography variant="body2" sx={{ fontWeight: 700, color: selected ? '#2D3282' : '#1E293B' }}>
                        {opt.title}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {opt.desc}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>

        {/* Submissões */}
        <Card sx={{ borderRadius: 3, border: '1.5px solid #EDF2F7' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: '#1E293B' }}>
              Submissões
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              Defina como as submissões serão permitidas.
            </Typography>

            <Box
              sx={{
                p: 1.75,
                border: '1.5px solid',
                borderColor: config.multiplas ? '#2D3282' : '#E2E8F0',
                borderRadius: 2.5,
                backgroundColor: config.multiplas ? '#F0F2F9' : 'transparent',
                transition: 'all 0.18s',
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={config.multiplas}
                    onChange={(e) => onChange({ multiplas: e.target.checked })}
                    size="small"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                      Permitir múltiplas submissões
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      O aluno poderá enviar novas soluções até o prazo final da atividade.
                    </Typography>
                  </Box>
                }
                sx={{ alignItems: 'flex-start', m: 0 }}
              />
            </Box>

            {config.multiplas && (
              <Alert
                severity="info"
                variant="outlined"
                icon={<CheckCircleIcon fontSize="small" />}
                sx={{ mt: 1.5, borderRadius: 2, fontSize: '0.78rem' }}
              >
                O aluno verá o resultado imediatamente após cada submissão.
              </Alert>
            )}
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5 }}>
        <Button
          variant="outlined"
          onClick={onBack}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            color: '#475569',
            borderColor: '#CBD5E1',
            px: 3,
            fontWeight: 600,
          }}
        >
          Voltar
        </Button>
        <Button
          id="wizard-step4-continuar"
          variant="contained"
          onClick={onNext}
          sx={{
            borderRadius: 2,
            backgroundColor: '#2D3282',
            '&:hover': { backgroundColor: '#1E2260' },
            textTransform: 'none',
            px: 4,
            fontWeight: 600,
            minWidth: 130,
          }}
        >
          Continuar
        </Button>
      </Box>
    </Box>
  );
}

// ─── Step 5: Revisão ─────────────────────────────────────────────────────────

function StepRevisao({ atividadeData, funcoes, config, onBack, onPublish, publishing }) {
  const pontuacaoTotal = funcoes.reduce((acc, f) => acc + (Number(f.pontos) || 0), 0);

  const validacoes = [
    { label: 'Informações preenchidas', ok: !!atividadeData.titulo },
    { label: `${funcoes.length} função(ões) cadastrada(s)`, ok: funcoes.length > 0 },
    {
      label: 'Todos os casos de teste cadastrados',
      ok: true,
    },
    {
      label: `Pontuação total: ${pontuacaoTotal.toFixed(1).replace('.', ',')}/${pontuacaoTotal.toFixed(1).replace('.', ',')}`,
      ok: pontuacaoTotal > 0,
    },
    { label: 'Configurações definidas', ok: true },
  ];

  const tipoLabel = atividadeData.tipo === 'exercicio' ? 'Exercício de prática' : 'Trabalho avaliativo';

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#1E293B' }}>
        Revisão e publicação
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
        {/* Resumo da atividade */}
        <Card sx={{ borderRadius: 3, border: '1.5px solid #EDF2F7' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#1E293B' }}>
              Resumo da atividade
            </Typography>
            {[
              { label: 'Título', value: atividadeData.titulo },
              { label: 'Tipo', value: tipoLabel },
              {
                label: 'Período',
                value: atividadeData.dataFechamento
                  ? new Date(atividadeData.dataFechamento).toLocaleDateString('pt-BR')
                  : 'Sem prazo',
              },
              { label: 'Pontuação máxima', value: `${pontuacaoTotal.toFixed(1).replace('.', ',')} pontos` },
              { label: 'Testes visíveis', value: config.testesVisiveis ? 'Sim' : 'Não' },
              { label: 'Múltiplas submissões', value: config.multiplas ? 'Permitidas' : 'Não' },
            ].map(({ label, value }) => (
              <Box key={label} sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  {label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                  {value}
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>

        {/* Funções */}
        <Card sx={{ borderRadius: 3, border: '1.5px solid #EDF2F7' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#1E293B' }}>
              Funções ({funcoes.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {funcoes.map((fn) => (
                <Box key={fn.uuid}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 2,
                        backgroundColor: '#EEF2FF',
                        color: '#4F46E5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <DataObjectIcon sx={{ fontSize: 16 }} />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, fontFamily: 'monospace', color: '#0F172A' }}
                    >
                      {fn.nomeFuncao || fn.nome_funcao}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ pl: 4.5 }}>
                    {fn.pontos} pts • {(fn.parametros || []).length} parâmetro(s)
                  </Typography>
                </Box>
              ))}
              {funcoes.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Nenhuma função.
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Validação */}
        <Card sx={{ borderRadius: 3, border: '1.5px solid #EDF2F7' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#1E293B' }}>
              Validação
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {validacoes.map(({ label, ok }) => (
                <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon
                    sx={{ fontSize: 18, color: ok ? '#10B981' : '#CBD5E1' }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ color: ok ? '#0F172A' : '#94A3B8', fontWeight: ok ? 600 : 400 }}
                  >
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5 }}>
        <Button
          variant="outlined"
          onClick={onBack}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            color: '#475569',
            borderColor: '#CBD5E1',
            px: 3,
            fontWeight: 600,
          }}
        >
          Voltar
        </Button>
        <Button
          id="wizard-publicar"
          variant="contained"
          color="primary"
          startIcon={
            publishing ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <PublishIcon />
            )
          }
          onClick={onPublish}
          disabled={publishing || funcoes.length === 0}
          sx={{
            minWidth: 180,
            borderRadius: 2,
            backgroundColor: '#2D3282',
            '&:hover': { backgroundColor: '#1E2260' },
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          {publishing ? 'Publicando...' : 'Publicar atividade'}
        </Button>
      </Box>
    </Box>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export default function CreateActivityWizard() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useSnackbar();

  const [step, setStep] = useState(1);
  const [creating, setCreating] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Dados da atividade criada no backend
  const [atividadeUuid, setAtividadeUuid] = useState(null);
  const [funcoes, setFuncoes] = useState([]);

  // Dados do formulário (step 1)
  const [infoData, setInfoData] = useState({
    titulo: '',
    descricao: '',
    tipo: 'exercicio',
    dataFechamento: '',
  });

  // Configurações (step 4)
  const [config, setConfig] = useState({
    testesVisiveis: true,
    multiplas: true,
  });

  // ── Criar atividade no backend ao avançar do step 1 ────────────────────────
  const handleStep1Next = async () => {
    if (atividadeUuid) {
      setStep(2);
      return;
    }
    setCreating(true);
    try {
      const payload = {
        titulo: infoData.titulo,
        descricao: infoData.descricao || null,
        tipo: infoData.tipo,
        status: 'rascunho',
        pontuacaoMaxima: 100,
        bloquearPaste: false,
      };
      if (infoData.dataFechamento) {
        payload.dataFechamento = new Date(infoData.dataFechamento).toISOString();
      }
      const data = await createAtividade(payload);
      setAtividadeUuid(data.uuid);
      setStep(2);
    } catch (err) {
      showError(err.response?.data?.detail || 'Erro ao criar atividade');
    } finally {
      setCreating(false);
    }
  };

  // ── Recarregar funções ─────────────────────────────────────────────────────
  const reloadFuncoes = useCallback(async () => {
    if (!atividadeUuid) return;
    try {
      const data = await getFuncoes(atividadeUuid);
      setFuncoes(Array.isArray(data) ? data : []);
    } catch {
      try {
        const atv = await getAtividade(atividadeUuid);
        setFuncoes(atv.funcoes || []);
      } catch {
        /* silencioso */
      }
    }
  }, [atividadeUuid]);

  // ── Publicar ───────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    setPublishing(true);
    try {
      await updateAtividade(atividadeUuid, { status: 'publicado' });
      showSuccess('Atividade publicada com sucesso!');
      navigate(`/atividades/${atividadeUuid}`);
    } catch (err) {
      showError(err.response?.data?.detail || 'Erro ao publicar');
    } finally {
      setPublishing(false);
    }
  };

  const stepTitles = [
    '04. Criar Atividade — Informações',
    '04. Criar Atividade — Funções',
    '04. Criar Atividade — Casos de Teste',
    '04. Configurações da Atividade',
    '04. Revisão e Publicação',
  ];

  return (
    <Box className="fade-in" sx={{ maxWidth: 840, mx: 'auto', p: { xs: 2, md: 4 } }}>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Tooltip title="Voltar para Atividades">
          <IconButton size="small" onClick={() => navigate('/atividades')}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em' }}>
          {stepTitles[step - 1]}
        </Typography>
      </Box>

      <WizardStepper currentStep={step} />

      {/* Step content */}
      <Box>
        {step === 1 && (
          <StepInformacoes
            data={infoData}
            onChange={(patch) => setInfoData((p) => ({ ...p, ...patch }))}
            onNext={handleStep1Next}
            saving={creating}
          />
        )}

        {step === 2 && atividadeUuid && (
          <StepFuncoes
            atividadeUuid={atividadeUuid}
            funcoes={funcoes}
            onFuncaoAdded={reloadFuncoes}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <StepCasosTeste
            funcoes={funcoes}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}

        {step === 4 && (
          <StepConfiguracoes
            config={config}
            onChange={(patch) => setConfig((p) => ({ ...p, ...patch }))}
            onBack={() => setStep(3)}
            onNext={() => setStep(5)}
          />
        )}

        {step === 5 && (
          <StepRevisao
            atividadeData={infoData}
            funcoes={funcoes}
            config={config}
            onBack={() => setStep(4)}
            onPublish={handlePublish}
            publishing={publishing}
          />
        )}
      </Box>

      {/* Loading overlay para criação */}
      {creating && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(255,255,255,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <CircularProgress sx={{ color: '#2D3282' }} />
        </Box>
      )}
    </Box>
  );
}

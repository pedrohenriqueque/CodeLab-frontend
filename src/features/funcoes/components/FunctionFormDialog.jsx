/**
 * FunctionFormDialog — Formulário para Criar/Editar Função na Biblioteca.
 * Design proporcional, limpo e responsivo alinhado à referência visual.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  MenuItem,
  ListSubheader,
  CircularProgress,
  Divider,
  Alert,
  Tooltip,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import CheckIcon from '@mui/icons-material/Check';
import { formatCParameterSignature } from '../../../shared/components/testCaseValues';

// Apenas Escalares: em C, funções não retornam vetores e retorno de ponteiro/string gera riscos de memória/segfault
const C_RETURN_OPTIONS = [
  { value: 'int', label: 'int' },
  { value: 'long', label: 'long' },
  { value: 'float', label: 'float' },
  { value: 'double', label: 'double' },
  { value: 'char', label: 'char' },
  { value: 'bool', label: 'bool' },
];

// Parâmetros: Escalares e Vetores com Opção A para char[] (Texto vs Vetor de Caracteres)
const C_PARAM_OPTIONS_SCALARS = [
  { value: 'int', label: 'int' },
  { value: 'long', label: 'long' },
  { value: 'float', label: 'float' },
  { value: 'double', label: 'double' },
  { value: 'char', label: 'char' },
  { value: 'bool', label: 'bool' },
];

const C_PARAM_OPTIONS_VECTORS = [
  { value: 'string', label: 'Texto (char[])' },
  { value: 'char[]', label: 'Vetor de Caracteres (char[])' },
  { value: 'int[]', label: 'int[]' },
  { value: 'long[]', label: 'long[]' },
  { value: 'float[]', label: 'float[]' },
  { value: 'double[]', label: 'double[]' },
];

const INITIAL_STATE = {
  nomeFuncao: '',
  enunciado: '',
  retorno: 'int',
  dificuldadePadrao: 'MEDIO',
  compartilhada: true,
  parametros: [
    { nome: 'a', tipo: 'int' },
    { nome: 'b', tipo: 'int' },
  ],
};

function getApiErrorMessage(error) {
  const data = error.response?.data;
  if (data?.campos?.length) {
    return `${data.erro || 'Dados inválidos.'} Verifique: ${data.campos.join(', ')}.`;
  }
  return data?.erro || data?.detail || 'Não foi possível salvar a função.';
}

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    backgroundColor: '#FFFFFF',
    fontSize: '0.875rem',
    color: '#0F172A',
    '& fieldset': {
      borderColor: '#E2E8F0',
    },
    '&:hover fieldset': {
      borderColor: '#CBD5E1',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#2563EB',
      borderWidth: '1.5px',
    },
    '&.Mui-error fieldset': {
      borderColor: '#EF4444',
    },
    '& input': {
      py: 1,
      px: 1.5,
    },
  },
  '& .MuiInputBase-input::placeholder': {
    color: '#94A3B8',
    opacity: 1,
  },
};

const selectSx = {
  ...inputSx,
  '& .MuiSelect-select': {
    py: '8px !important',
    px: '12px !important',
    color: '#0F172A',
  },
};

export default function FunctionFormDialog({ open, onClose, onSave, initialData }) {
  const [form, setForm] = useState(INITIAL_STATE);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setFormError('');
      setCopied(false);
      if (initialData) {
        setForm({
          nomeFuncao: initialData.nome || '',
          enunciado: initialData.enunciado || '',
          retorno: initialData.tipoRetorno || 'int',
          dificuldadePadrao: initialData.dificuldade || 'MEDIO',
          compartilhada: initialData.compartilhada ?? false,
          parametros: initialData.parametros?.length
            ? initialData.parametros.map((p) => ({ nome: p.nome, tipo: p.tipo }))
            : [
                { nome: 'a', tipo: 'int' },
                { nome: 'b', tipo: 'int' },
              ],
        });
      } else {
        setForm(INITIAL_STATE);
      }
    }
  }, [open, initialData]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleParamChange = (index, field) => (e) => {
    setForm((prev) => {
      const params = [...prev.parametros];
      params[index] = { ...params[index], [field]: e.target.value };
      return { ...prev, parametros: params };
    });
  };

  const addParam = () => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const usedNames = new Set(form.parametros.map((p) => p.nome.trim().toLowerCase()));
    let nextName = '';
    for (const char of alphabet) {
      if (!usedNames.has(char)) {
        nextName = char;
        break;
      }
    }
    setForm((prev) => ({
      ...prev,
      parametros: [...prev.parametros, { nome: nextName || `p${prev.parametros.length + 1}`, tipo: 'int' }],
    }));
  };

  const removeParam = (index) => {
    setForm((prev) => ({
      ...prev,
      parametros: prev.parametros.filter((_, i) => i !== index),
    }));
  };

  const cleanName = form.nomeFuncao.trim();
  const nameValid = cleanName === '' || /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cleanName);
  const canSubmit = cleanName.length > 0 && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cleanName);

  const validParams = form.parametros.filter((p) => p.nome && p.nome.trim());
  const formattedSignature = `${form.retorno} ${cleanName || 'somar'}(${
    validParams.length > 0 ? validParams.map((p) => formatCParameterSignature(p.nome, p.tipo)).join(', ') : 'void'
  });`;

  const handleCopySignature = () => {
    navigator.clipboard.writeText(formattedSignature);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    try {
      setFormError('');
      const payload = {
        nome: cleanName,
        enunciado: form.enunciado.trim(),
        tipoRetorno: form.retorno,
        dificuldade: form.dificuldadePadrao,
        ...(initialData ? { compartilhada: form.compartilhada } : {}),
        parametros: form.parametros.filter((p) => p.nome && p.nome.trim()),
      };
      await onSave(payload);
      onClose();
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: '540px',
          borderRadius: '16px',
          bgcolor: '#FFFFFF',
          boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.2), 0 8px 10px -6px rgba(15, 23, 42, 0.1)',
          m: { xs: 1.5, sm: 2 },
          maxHeight: 'min(92vh, 760px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Cabeçalho Fixo do Modal */}
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 2.5, sm: 3 },
            pt: 2.5,
            pb: 1,
            m: 0,
          }}
        >
          <Typography
            component="span"
            sx={{
              fontWeight: 700,
              fontSize: '1.2rem',
              color: '#0F172A',
              letterSpacing: '-0.01em',
            }}
          >
            {initialData ? 'Editar Função na Biblioteca' : 'Nova Função na Biblioteca'}
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: '#64748B',
              borderRadius: '8px',
              p: 0.5,
              '&:hover': { color: '#0F172A', bgcolor: '#F1F5F9' },
            }}
            aria-label="Fechar"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        {/* Conteúdo com Scroll Interno Limpo */}
        <DialogContent
          sx={{
            px: { xs: 2.5, sm: 3 },
            py: 1,
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#CBD5E1',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: '#94A3B8',
            },
          }}
        >
          {formError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>
              {formError}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Campo: Nome da Função */}
            <Box>
              <Typography
                component="label"
                htmlFor="funcao-nome"
                sx={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1E293B', mb: 0.5 }}
              >
                Nome da Função <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <TextField
                id="funcao-nome"
                value={form.nomeFuncao}
                onChange={handleChange('nomeFuncao')}
                placeholder="somar"
                fullWidth
                size="small"
                error={cleanName.length > 0 && !nameValid}
                sx={inputSx}
              />
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  color: cleanName.length > 0 && !nameValid ? '#EF4444' : '#64748B',
                  mt: 0.5,
                }}
              >
                {cleanName.length > 0 && !nameValid
                  ? 'Nome deve ser um identificador C válido (letras, números e _, sem iniciar por número).'
                  : 'Identificador C único da função. Use apenas letras, números e _ (underscore).'}
              </Typography>
            </Box>

            {/* Campo: Descrição / Enunciado */}
            <Box>
              <Typography
                component="label"
                htmlFor="funcao-descricao"
                sx={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1E293B', mb: 0.5 }}
              >
                Descrição / Enunciado <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <TextField
                id="funcao-descricao"
                value={form.enunciado}
                onChange={handleChange('enunciado')}
                placeholder="Descreva o que a função faz, quais são os parâmetros e o que deve ser retornado..."
                fullWidth
                multiline
                rows={3}
                sx={{
                  ...inputSx,
                  '& .MuiInputBase-root': {
                    p: 1.25,
                  },
                }}
              />
            </Box>

            {/* Linha com 2 Colunas: Tipo de Retorno & Dificuldade Padrão */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <Typography
                    component="label"
                    htmlFor="funcao-retorno"
                    sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}
                  >
                    Tipo de Retorno
                  </Typography>
                  <Tooltip title="Tipo de dado retornado pela função em C" arrow placement="top">
                    <HelpOutlineOutlinedIcon
                      sx={{ fontSize: 16, color: '#64748B', cursor: 'pointer', verticalAlign: 'middle' }}
                    />
                  </Tooltip>
                </Box>
                <TextField
                  id="funcao-retorno"
                  select
                  value={form.retorno}
                  onChange={handleChange('retorno')}
                  fullWidth
                  size="small"
                  sx={selectSx}
                >
                  {C_RETURN_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                  {!C_RETURN_OPTIONS.some((opt) => opt.value === form.retorno) && (
                    <MenuItem value={form.retorno}>
                      {form.retorno}
                    </MenuItem>
                  )}
                </TextField>
              </Box>

              <Box>
                <Typography
                  component="label"
                  htmlFor="funcao-dificuldade"
                  sx={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1E293B', mb: 0.5 }}
                >
                  Dificuldade Padrão
                </Typography>
                <TextField
                  id="funcao-dificuldade"
                  select
                  value={form.dificuldadePadrao}
                  onChange={handleChange('dificuldadePadrao')}
                  fullWidth
                  size="small"
                  sx={selectSx}
                >
                  <MenuItem value="FACIL">Fácil</MenuItem>
                  <MenuItem value="MEDIO">Médio</MenuItem>
                  <MenuItem value="DIFICIL">Difícil</MenuItem>
                </TextField>
              </Box>
            </Box>

            {/* Opção de Compartilhamento (quando editando) */}
            {initialData && (
              <Box sx={{ bgcolor: '#F8FAFC', p: 1.25, borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.compartilhada}
                      onChange={(event) =>
                        setForm((previous) => ({ ...previous, compartilhada: event.target.checked }))
                      }
                      size="small"
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                      Compartilhar com outros professores
                    </Typography>
                  }
                />
                <Typography sx={{ fontSize: '0.75rem', color: '#64748B', ml: 3.5, mt: -0.5 }}>
                  Funções compartilhadas ficam acessíveis na biblioteca coletiva de professores.
                </Typography>
              </Box>
            )}

            <Divider sx={{ borderColor: '#F1F5F9', my: 0.5 }} />

            {/* Seção: Parâmetros da Função */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
                <Typography
                  component="h3"
                  sx={{ fontWeight: 700, fontSize: '0.925rem', color: '#0F172A' }}
                >
                  Parâmetros da Função
                </Typography>
                <Button
                  onClick={addParam}
                  startIcon={<AddCircleIcon sx={{ color: '#2563EB', fontSize: 18 }} />}
                  sx={{
                    textTransform: 'none',
                    color: '#2563EB',
                    fontWeight: 600,
                    fontSize: '0.825rem',
                    p: 0,
                    minWidth: 0,
                    '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                  }}
                >
                  Adicionar parâmetro
                </Button>
              </Box>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748B', mb: 1.5 }}>
                Adicione os parâmetros que a função recebe, na ordem em que aparecem na assinatura.
              </Typography>

              {/* Lista Dinâmica de Parâmetros */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {form.parametros.map((param, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        component="label"
                        sx={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', mb: 0.4 }}
                      >
                        Nome
                      </Typography>
                      <TextField
                        value={param.nome}
                        onChange={handleParamChange(idx, 'nome')}
                        placeholder="ex: a"
                        size="small"
                        fullWidth
                        sx={inputSx}
                      />
                    </Box>

                    <Box sx={{ width: { xs: 150, sm: 220 }, flexShrink: 0 }}>
                      <Typography
                        component="label"
                        sx={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', mb: 0.4 }}
                      >
                        Tipo
                      </Typography>
                      <TextField
                        select
                        value={param.tipo}
                        onChange={handleParamChange(idx, 'tipo')}
                        size="small"
                        fullWidth
                        sx={selectSx}
                        SelectProps={{
                          MenuProps: {
                            PaperProps: {
                              sx: { maxHeight: 320 },
                            },
                          },
                        }}
                      >
                        <ListSubheader sx={{ fontWeight: 700, color: '#64748B', lineHeight: '30px', bgcolor: '#F8FAFC' }}>
                          Escalares
                        </ListSubheader>
                        {C_PARAM_OPTIONS_SCALARS.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                        <ListSubheader sx={{ fontWeight: 700, color: '#64748B', lineHeight: '30px', bgcolor: '#F8FAFC' }}>
                          Textos e Vetores
                        </ListSubheader>
                        {C_PARAM_OPTIONS_VECTORS.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                        {![...C_PARAM_OPTIONS_SCALARS, ...C_PARAM_OPTIONS_VECTORS].some((o) => o.value === param.tipo) && (
                          <MenuItem value={param.tipo}>
                            {param.tipo}
                          </MenuItem>
                        )}
                      </TextField>
                    </Box>

                    <Box sx={{ pt: '22px' }}>
                      <IconButton
                        onClick={() => removeParam(idx)}
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '10px',
                          border: '1px solid #FECACA',
                          bgcolor: '#FFFFFF',
                          color: '#EF4444',
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            bgcolor: '#FEF2F2',
                            borderColor: '#F87171',
                          },
                        }}
                        title="Remover parâmetro"
                        aria-label="Remover parâmetro"
                      >
                        <DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  </Box>
                ))}

                {form.parametros.length === 0 && (
                  <Box
                    sx={{
                      p: 1.5,
                      textAlign: 'center',
                      border: '1px dashed #CBD5E1',
                      borderRadius: '10px',
                      bgcolor: '#F8FAFC',
                    }}
                  >
                    <Typography sx={{ fontSize: '0.78rem', color: '#64748B' }}>
                      Nenhum parâmetro adicionado (a função receberá <code>void</code>).
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Preview: Assinatura C da Função */}
            <Box
              sx={{
                p: 1.75,
                borderRadius: '12px',
                bgcolor: '#EFF6FF',
                border: '1px solid #DBEAFE',
              }}
            >
              <Typography
                component="h4"
                sx={{
                  color: '#1D4ED8',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  mb: 1,
                }}
              >
                Assinatura C da Função
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  bgcolor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  px: 1.75,
                  py: 1,
                }}
              >
                <Box
                  component="code"
                  sx={{
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                    fontSize: '0.88rem',
                    letterSpacing: '0.01em',
                    overflowX: 'auto',
                    py: 0.1,
                  }}
                >
                  <span style={{ color: '#2563EB', fontWeight: 600 }}>{form.retorno}</span>
                  {' '}
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>{cleanName || 'somar'}</span>
                  <span style={{ color: '#0F172A' }}>(</span>
                  {validParams.length === 0 ? (
                    <span style={{ color: '#64748B' }}>void</span>
                  ) : (
                    validParams.map((p, i) => (
                      <span key={i}>
                        {i > 0 && <span style={{ color: '#0F172A' }}>, </span>}
                        <span style={{ color: '#2563EB', fontWeight: 600 }}>{p.tipo}</span>
                        {' '}
                        <span style={{ color: '#0F172A' }}>{p.nome.trim()}</span>
                      </span>
                    ))
                  )}
                  <span style={{ color: '#0F172A' }}>);</span>
                </Box>

                <Tooltip title={copied ? 'Copiado!' : 'Copiar assinatura'} arrow placement="top">
                  <IconButton
                    onClick={handleCopySignature}
                    size="small"
                    sx={{
                      color: copied ? '#10B981' : '#64748B',
                      ml: 1,
                      p: 0.5,
                      borderRadius: '6px',
                      '&:hover': { color: '#0F172A', bgcolor: '#E2E8F0' },
                    }}
                    aria-label="Copiar assinatura"
                  >
                    {copied ? <CheckIcon sx={{ fontSize: 17 }} /> : <ContentCopyOutlinedIcon sx={{ fontSize: 17 }} />}
                  </IconButton>
                </Tooltip>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1 }}>
                <InfoOutlinedIcon sx={{ fontSize: 15, color: '#64748B', flexShrink: 0 }} />
                <Typography sx={{ fontSize: '0.75rem', color: '#64748B', lineHeight: 1.35 }}>
                  Essa assinatura será usada como referência nas atividades e no editor do aluno.
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        {/* Rodapé Fixo com Ações */}
        <DialogActions
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 1.5,
            px: { xs: 2.5, sm: 3 },
            pt: 1.5,
            pb: 2.5,
          }}
        >
          <Button
            onClick={onClose}
            disabled={saving}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: '#2563EB',
              px: 2,
              py: 0.75,
              borderRadius: '8px',
              '&:hover': { bgcolor: 'rgba(37, 99, 235, 0.05)' },
            }}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={saving || !canSubmit}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              bgcolor: '#1D4ED8',
              '&:hover': { bgcolor: '#1E40AF' },
              borderRadius: '9999px',
              px: 3.5,
              py: 0.9,
              boxShadow: 'none',
              '&.Mui-disabled': {
                bgcolor: '#E2E8F0',
                color: '#94A3B8',
              },
            }}
          >
            {saving ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} color="inherit" />
                <span>Salvando...</span>
              </Box>
            ) : (
              'Salvar Função'
            )}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

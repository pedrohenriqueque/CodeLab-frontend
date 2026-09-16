/**
 * FunctionFormDialog — Formulário para Criar/Editar Função na Biblioteca.
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
  CircularProgress,
  Divider,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import SaveIcon from '@mui/icons-material/Save';

const C_TYPES = ['int', 'float', 'double', 'char', 'long', 'void'];

const INITIAL_STATE = {
  nomeFuncao: '',
  descricao: '',
  retorno: 'int',
  dificuldadePadrao: 'medio',
  parametros: [{ nome: 'a', tipo: 'int' }],
};

export default function FunctionFormDialog({ open, onClose, onSave, initialData }) {
  const [form, setForm] = useState(INITIAL_STATE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          nomeFuncao: initialData.nomeFuncao || initialData.nome_funcao || '',
          descricao: initialData.descricao || '',
          retorno: initialData.retorno?.tipo || initialData.retorno || 'int',
          dificuldadePadrao: initialData.dificuldadePadrao || initialData.dificuldade_padrao || initialData.dificuldade || 'medio',
          parametros: initialData.parametros?.length
            ? initialData.parametros.map((p) => ({ nome: p.nome, tipo: p.tipo }))
            : [{ nome: 'a', tipo: 'int' }],
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
    setForm((prev) => ({
      ...prev,
      parametros: [...prev.parametros, { nome: '', tipo: 'int' }],
    }));
  };

  const removeParam = (index) => {
    setForm((prev) => ({
      ...prev,
      parametros: prev.parametros.filter((_, i) => i !== index),
    }));
  };

  const nameValid = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(form.nomeFuncao.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nameValid || !form.nomeFuncao.trim()) return;

    setSaving(true);
    try {
      const payload = {
        nomeFuncao: form.nomeFuncao.trim(),
        descricao: form.descricao?.trim() || null,
        retorno: { tipo: form.retorno },
        dificuldadePadrao: form.dificuldadePadrao,
        parametros: form.parametros.filter((p) => p.nome && p.nome.trim()),
      };
      await onSave(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ component: 'form', onSubmit: handleSubmit, sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1, color: '#1E293B' }}>
        {initialData ? 'Editar Função na Biblioteca' : 'Nova Função na Biblioteca'}
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: '#E2E8F0' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <TextField
            id="funcao-nome"
            label="Nome da Função"
            value={form.nomeFuncao}
            onChange={handleChange('nomeFuncao')}
            required
            fullWidth
            autoFocus
            error={form.nomeFuncao.length > 0 && !nameValid}
            helperText={
              form.nomeFuncao.length > 0 && !nameValid
                ? 'Nome deve ser um identificador C válido (ex: fatorial, soma_array)'
                : 'Identificador C único da função'
            }
            placeholder="ex: calcula_fatorial"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          <TextField
            id="funcao-descricao"
            label="Descrição / Enunciado"
            value={form.descricao}
            onChange={handleChange('descricao')}
            fullWidth
            multiline
            rows={3}
            placeholder="Descreva o que a função deve implementar..."
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              id="funcao-retorno"
              label="Tipo de Retorno"
              select
              value={form.retorno}
              onChange={handleChange('retorno')}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            >
              {C_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              id="funcao-dificuldade"
              label="Dificuldade Padrão"
              select
              value={form.dificuldadePadrao}
              onChange={handleChange('dificuldadePadrao')}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            >
              <MenuItem value="facil">Fácil</MenuItem>
              <MenuItem value="medio">Médio</MenuItem>
              <MenuItem value="dificil">Difícil</MenuItem>
            </TextField>
          </Box>

          <Divider />

          {/* Parâmetros C */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155' }}>
                Parâmetros da Função
              </Typography>
              <Button
                size="small"
                startIcon={<AddCircleIcon />}
                onClick={addParam}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Adicionar Parâmetro
              </Button>
            </Box>

            {form.parametros.map((param, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1.5 }}>
                <TextField
                  label="Nome"
                  value={param.nome}
                  onChange={handleParamChange(idx, 'nome')}
                  size="small"
                  sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  placeholder="ex: n"
                />
                <TextField
                  label="Tipo"
                  select
                  value={param.tipo}
                  onChange={handleParamChange(idx, 'tipo')}
                  size="small"
                  sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                  onClick={() => removeParam(idx)}
                  disabled={form.parametros.length <= 1}
                >
                  <RemoveCircleIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>

          {/* Assinatura Preview */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: '#F8FAFC',
              border: '1px solid #E2E8F0',
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600, mb: 0.5 }}>
              Assinatura C da Função:
            </Typography>
            <code style={{ color: '#0F172A', fontWeight: 700, fontFamily: 'monospace', fontSize: '0.9rem' }}>
              {form.retorno} {form.nomeFuncao.trim() || 'nome_funcao'}(
              {form.parametros
                .filter((p) => p.nome && p.nome.trim())
                .map((p) => `${p.tipo} ${p.nome.trim()}`)
                .join(', ') || 'void'}
              );
            </code>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none' }}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={saving || !form.nomeFuncao.trim() || !nameValid}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          sx={{
            borderRadius: 2,
            px: 3,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          {saving ? 'Salvando...' : 'Salvar Função'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

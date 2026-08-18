/**
 * FuncaoForm — dialog para criar/editar uma função C.
 *
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   onSave: (data) => Promise<void>
 *   initialData: object | null
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
  pontos: 10,
  retorno: 'int',
  dificuldade: 'medio',
  dicas: ['', '', ''],
  parametros: [{ nome: 'a', tipo: 'int' }],
};

export default function FuncaoForm({ open, onClose, onSave, initialData }) {
  const [form, setForm] = useState(INITIAL_STATE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          nomeFuncao: initialData.nomeFuncao || '',
          descricao: initialData.descricao || '',
          pontos: initialData.pontos || 10,
          retorno: initialData.retorno?.tipo || 'int',
          dificuldade: initialData.dificuldade || 'medio',
          dicas: initialData.dicas?.length ? [...initialData.dicas, '', '', ''].slice(0, 3) : ['', '', ''],
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

  const handleDicaChange = (index) => (e) => {
    setForm((prev) => {
      const newDicas = [...prev.dicas];
      newDicas[index] = e.target.value;
      return { ...prev, dicas: newDicas };
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nomeFuncao: form.nomeFuncao,
        descricao: form.descricao || null,
        pontos: Number(form.pontos),
        retorno: { tipo: form.retorno },
        dificuldade: form.dificuldade,
        dicas: form.dicas.filter((d) => d.trim()),
        parametros: form.parametros.filter((p) => p.nome.trim()),
      };
      await onSave(payload);
      onClose();
    } catch {
      // caller handles error
    } finally {
      setSaving(false);
    }
  };

  const nameValid = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(form.nomeFuncao);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ component: 'form', onSubmit: handleSubmit }}
    >
      <DialogTitle sx={{ fontWeight: 600 }}>
        {initialData ? 'Editar Função' : 'Nova Função'}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          {/* Nome da função */}
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
                : 'Nome da função C que o aluno deve implementar'
            }
            placeholder="ex: fatorial"
          />

          {/* Descrição */}
          <TextField
            id="funcao-descricao"
            label="Descrição / Enunciado"
            value={form.descricao}
            onChange={handleChange('descricao')}
            fullWidth
            multiline
            rows={2}
            placeholder="Descreva o que a função deve fazer..."
          />

          {/* Pontos, Retorno e Dificuldade */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
            <TextField
              id="funcao-pontos"
              label="Pontos"
              type="number"
              value={form.pontos}
              onChange={handleChange('pontos')}
              inputProps={{ min: 0 }}
            />
            <TextField
              id="funcao-retorno"
              label="Retorno"
              select
              value={form.retorno}
              onChange={handleChange('retorno')}
            >
              {C_TYPES.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>
            <TextField
              id="funcao-dificuldade"
              label="Dificuldade"
              select
              value={form.dificuldade}
              onChange={handleChange('dificuldade')}
            >
              <MenuItem value="facil">Fácil</MenuItem>
              <MenuItem value="medio">Médio</MenuItem>
              <MenuItem value="dificil">Difícil</MenuItem>
            </TextField>
          </Box>

          <Divider />

          {/* Parâmetros */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Parâmetros
              </Typography>
              <Button
                size="small"
                startIcon={<AddCircleIcon />}
                onClick={addParam}
              >
                Adicionar
              </Button>
            </Box>

            {form.parametros.map((param, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                <TextField
                  label="Nome"
                  value={param.nome}
                  onChange={handleParamChange(idx, 'nome')}
                  size="small"
                  sx={{ flex: 1 }}
                  placeholder="ex: n"
                />
                <TextField
                  label="Tipo"
                  select
                  value={param.tipo}
                  onChange={handleParamChange(idx, 'tipo')}
                  size="small"
                  sx={{ width: 120 }}
                >
                  {C_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
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

          <Divider />

          {/* Dicas Progressivas */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
              Dicas Progressivas (Opcional)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              Preencha para liberar dicas conforme o aluno erra as submissões.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <TextField
                label="Dica 1 (Falha 1: Conceitual)"
                value={form.dicas[0]}
                onChange={handleDicaChange(0)}
                size="small"
                fullWidth
                placeholder="Ex: Lembre que um loop precisa de variável de controle"
              />
              <TextField
                label="Dica 2 (Falha 2: Estrutural)"
                value={form.dicas[1]}
                onChange={handleDicaChange(1)}
                size="small"
                fullWidth
                placeholder="Ex: Inicialize o acumulador antes do loop"
              />
              <TextField
                label="Dica 3 (Falha 3: Pseudocódigo)"
                value={form.dicas[2]}
                onChange={handleDicaChange(2)}
                size="small"
                fullWidth
                placeholder="Ex: soma = 0; para i de 1 até n..."
              />
            </Box>
          </Box>

          {/* Preview da assinatura */}
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#F0F4F8', fontFamily: 'monospace', fontSize: '0.85rem' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontFamily: 'inherit' }}>
              Assinatura gerada:
            </Typography>
            <code>
              {form.retorno} {form.nomeFuncao || '???'}(
              {form.parametros
                .filter((p) => p.nome)
                .map((p) => `${p.tipo} ${p.nome}`)
                .join(', ')}
              )
            </code>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={saving || !form.nomeFuncao.trim() || !nameValid}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

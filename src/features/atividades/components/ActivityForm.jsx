/**
 * ActivityForm — dialog para criar/editar atividade.
 *
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   onSave: (data) => Promise<void>
 *   initialData: object | null (null = criação)
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
  CircularProgress,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

const STATUS_OPTIONS = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'publicado', label: 'Publicado' },
  { value: 'fechado', label: 'Fechado' },
];

const INITIAL_STATE = {
  titulo: '',
  descricao: '',
  pontuacaoMaxima: 100,
  dataAbertura: '',
  dataFechamento: '',
  status: 'rascunho',
  tipo: 'exercicio',
  duracaoMinutos: '',
  bloquearPaste: false,
};

export default function ActivityForm({ open, onClose, onSave, initialData }) {
  const [form, setForm] = useState(INITIAL_STATE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          titulo: initialData.titulo || '',
          descricao: initialData.descricao || '',
          pontuacaoMaxima: initialData.pontuacaoMaxima || 100,
          dataAbertura: initialData.dataAbertura?.slice(0, 16) || '',
          dataFechamento: initialData.dataFechamento?.slice(0, 16) || '',
          status: initialData.status || 'rascunho',
          tipo: initialData.tipo || 'exercicio',
          duracaoMinutos: initialData.duracaoMinutos || '',
          bloquearPaste: initialData.bloquearPaste || false,
        });
      } else {
        setForm(INITIAL_STATE);
      }
    }
  }, [open, initialData]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        titulo: form.titulo,
        descricao: form.descricao || null,
        pontuacaoMaxima: Number(form.pontuacaoMaxima),
        status: form.status,
        tipo: form.tipo,
        duracaoMinutos: form.duracaoMinutos ? Number(form.duracaoMinutos) : null,
        bloquearPaste: form.bloquearPaste,
      };
      if (form.dataAbertura) payload.dataAbertura = new Date(form.dataAbertura).toISOString();
      if (form.dataFechamento) payload.dataFechamento = new Date(form.dataFechamento).toISOString();

      await onSave(payload);
      onClose();
    } catch {
      // Error handling delegado ao caller via onSave
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!initialData;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ component: 'form', onSubmit: handleSubmit }}
    >
      <DialogTitle sx={{ fontWeight: 600 }}>
        {isEdit ? 'Editar Atividade' : 'Nova Atividade'}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <TextField
            id="activity-titulo"
            label="Título"
            value={form.titulo}
            onChange={handleChange('titulo')}
            required
            fullWidth
            autoFocus
          />
          <TextField
            id="activity-descricao"
            label="Descrição"
            value={form.descricao}
            onChange={handleChange('descricao')}
            fullWidth
            multiline
            rows={3}
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              id="activity-pontuacao"
              label="Pontuação Máxima"
              type="number"
              value={form.pontuacaoMaxima}
              onChange={handleChange('pontuacaoMaxima')}
              inputProps={{ min: 0 }}
            />
            <TextField
              id="activity-status"
              label="Status"
              select
              value={form.status}
              onChange={handleChange('status')}
              helperText={
                isEdit && initialData?.status !== 'rascunho'
                  ? 'Não é possível voltar para Rascunho'
                  : ''
              }
            >
              {STATUS_OPTIONS.map((opt) => {
                // Regra: se editando e status atual não é rascunho, bloquear voltar para rascunho
                const disabled =
                  isEdit &&
                  initialData?.status !== 'rascunho' &&
                  opt.value === 'rascunho';

                return (
                  <MenuItem key={opt.value} value={opt.value} disabled={disabled}>
                    {opt.label}
                    {disabled ? ' (bloqueado)' : ''}
                  </MenuItem>
                );
              })}
            </TextField>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              id="activity-abertura"
              label="Data de Abertura"
              type="datetime-local"
              value={form.dataAbertura}
              onChange={handleChange('dataAbertura')}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              id="activity-fechamento"
              label="Data de Fechamento"
              type="datetime-local"
              value={form.dataFechamento}
              onChange={handleChange('dataFechamento')}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              id="activity-tipo"
              label="Tipo de Atividade"
              select
              value={form.tipo}
              onChange={handleChange('tipo')}
            >
              <MenuItem value="exercicio">Exercício (Múltiplas submissões, feedback na hora)</MenuItem>
              <MenuItem value="prova">Prova (1 submissão, nota oculta)</MenuItem>
            </TextField>
            <TextField
              id="activity-duracao"
              label="Duração em Minutos (Timer)"
              type="number"
              value={form.duracaoMinutos}
              onChange={handleChange('duracaoMinutos')}
              inputProps={{ min: 1 }}
              placeholder="Ex: 120"
              helperText="Deixe em branco para sem limite"
            />
          </Box>
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={form.bloquearPaste}
                  onChange={(e) => setForm((prev) => ({ ...prev, bloquearPaste: e.target.checked }))}
                />
              }
              label={
                <Typography variant="body2">
                  Bloquear copiar/colar (Modo Prova Restrito)
                </Typography>
              }
            />
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
          disabled={saving || !form.titulo.trim()}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

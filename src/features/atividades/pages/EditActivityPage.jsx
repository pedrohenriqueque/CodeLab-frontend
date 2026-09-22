import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, Stack, TextField, Typography, Skeleton } from '@mui/material';
import useAtividadeDetail from '../hooks/useAtividadeDetail';
import { updateAtividade } from '../api';

function localDate(value) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function EditForm({ atividade }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ titulo: atividade.titulo, descricao: atividade.descricao || '', inicioEm: localDate(atividade.inicioEm), fimEm: localDate(atividade.fimEm) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const change = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  const save = async (event) => {
    event.preventDefault();
    if (!form.titulo.trim()) { setError('Informe o título.'); return; }
    if (new Date(form.inicioEm) >= new Date(form.fimEm)) { setError('A abertura deve ocorrer antes do encerramento.'); return; }
    setSaving(true);
    setError('');
    try {
      await updateAtividade(atividade.uuid, { ...form, titulo: form.titulo.trim(), inicioEm: new Date(form.inicioEm).toISOString(), fimEm: new Date(form.fimEm).toISOString() });
      navigate(`/atividades/${atividade.uuid}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.erro || 'Não foi possível salvar a atividade.');
    } finally { setSaving(false); }
  };
  return <Box component="form" onSubmit={save} sx={{ maxWidth: 800 }}><Stack spacing={3}>
    <Typography variant="h4">Editar atividade</Typography>
    <Typography color="text.secondary">Atualize os dados do rascunho. As funções e seus casos de teste serão preservados.</Typography>
    {error && <Alert severity="error">{error}</Alert>}
    <TextField required label="Título" value={form.titulo} onChange={change('titulo')} disabled={saving} slotProps={{ htmlInput: { maxLength: 200 } }} />
    <TextField label="Descrição" multiline minRows={4} value={form.descricao} onChange={change('descricao')} disabled={saving} slotProps={{ htmlInput: { maxLength: 10000 } }} />
    <TextField label="Abertura" required type="datetime-local" value={form.inicioEm} onChange={change('inicioEm')} disabled={saving} slotProps={{ inputLabel: { shrink: true } }} />
    <TextField label="Encerramento" required type="datetime-local" value={form.fimEm} onChange={change('fimEm')} disabled={saving} slotProps={{ inputLabel: { shrink: true } }} />
    <Alert severity="info">Gerencie as funções na tela de detalhes. O tipo da atividade não pode ser alterado.</Alert>
    <Stack direction="row" spacing={2}><Button disabled={saving} onClick={() => navigate(`/atividades/${atividade.uuid}`)}>Cancelar</Button><Button type="submit" variant="contained" disabled={saving}>{saving ? 'Salvando...' : 'Salvar alterações'}</Button></Stack>
  </Stack></Box>;
}

export default function EditActivityPage() {
  const { uuid } = useParams();
  const { atividade, loading, error, refetch } = useAtividadeDetail(uuid);
  const navigate = useNavigate();
  if (loading) return <Skeleton variant="rounded" height={360} />;
  if (error) return <Alert severity="error" action={<Button onClick={refetch}>Tentar novamente</Button>}>{error}</Alert>;
  if (!atividade) return <Alert severity="warning">Atividade não encontrada.</Alert>;
  if (atividade.status !== 'RASCUNHO') return <Alert severity="info" action={<Button onClick={() => navigate(`/atividades/${uuid}`)}>Ver atividade</Button>}>Somente rascunhos podem ser editados.</Alert>;
  return <EditForm key={uuid} atividade={atividade} />;
}

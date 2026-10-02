import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import { getBibliotecaFuncoes, getCasosTeste } from '../../funcoes/api';
import { associarFuncaoAtividade } from '../api';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';

const DIFICULDADES = [{ value: 'FACIL', label: 'Fácil' }, { value: 'MEDIO', label: 'Médio' }, { value: 'DIFICIL', label: 'Difícil' }];
const apiError = (error, fallback) => error.response?.data?.erro || error.response?.data?.detail || fallback;

export default function AssociateFunctionDialog({ open, onClose, atividadeUuid, existingFuncaoUuids = [], onSaved }) {
  const { showSuccess, showError } = useSnackbar();
  const [biblioteca, setBiblioteca] = useState([]);
  const [funcaoUuid, setFuncaoUuid] = useState('');
  const [dificuldade, setDificuldade] = useState('MEDIO');
  const [notaMaxima, setNotaMaxima] = useState('');
  const [casos, setCasos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFuncaoUuid(''); setDificuldade('MEDIO'); setNotaMaxima(''); setCasos([]); setLoading(true);
    getBibliotecaFuncoes().then((data) => setBiblioteca(Array.isArray(data) ? data : []))
      .catch((error) => showError(apiError(error, 'Erro ao carregar a biblioteca de funções.')))
      .finally(() => setLoading(false));
  }, [open, showError]);

  const selecionada = useMemo(() => biblioteca.find((funcao) => funcao.uuid === funcaoUuid), [biblioteca, funcaoUuid]);
  const selectFuncao = async (event) => {
    const uuid = event.target.value;
    const funcao = biblioteca.find((item) => item.uuid === uuid);
    setFuncaoUuid(uuid); setDificuldade(String(funcao?.dificuldade || 'MEDIO').toUpperCase()); setCasos([]);
    try { setCasos(await getCasosTeste(uuid)); } catch (error) { showError(apiError(error, 'Erro ao carregar os casos de teste.')); }
  };
  const save = async () => {
    const nota = Number(notaMaxima);
    if (!funcaoUuid || !Number.isFinite(nota) || nota <= 0) { showError('Selecione uma função e informe uma nota máxima maior que zero.'); return; }
    setSaving(true);
    try { await associarFuncaoAtividade(atividadeUuid, { funcaoUuid, dificuldade, notaMaxima: nota }); showSuccess('Função adicionada com todos os casos de teste.'); onSaved?.(); onClose(); }
    catch (error) { showError(apiError(error, 'Erro ao adicionar a função.')); }
    finally { setSaving(false); }
  };
  return <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
    <DialogTitle sx={{ fontWeight: 600 }}>Adicionar função da biblioteca</DialogTitle>
    <DialogContent dividers><Box sx={{ display: 'grid', gap: 2.5, pt: 1 }}>
      <Alert severity="info" variant="outlined">Todos os casos cadastrados na biblioteca serão copiados para a atividade. Eles não são selecionados individualmente.</Alert>
      <FormControl fullWidth disabled={loading}><InputLabel id="funcao-label">Função</InputLabel><Select labelId="funcao-label" label="Função" value={funcaoUuid} onChange={selectFuncao}>{biblioteca.map((funcao) => <MenuItem key={funcao.uuid} value={funcao.uuid} disabled={existingFuncaoUuids.includes(funcao.uuid)}>{funcao.nome}({(funcao.parametros || []).map((p) => `${p.tipo} ${p.nome}`).join(', ')})</MenuItem>)}</Select></FormControl>
      {selecionada && <Typography color="text.secondary" variant="body2">{selecionada.enunciado || 'Sem enunciado cadastrado.'}</Typography>}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}><FormControl fullWidth><InputLabel id="dificuldade-label">Dificuldade</InputLabel><Select labelId="dificuldade-label" label="Dificuldade" value={dificuldade} onChange={(event) => setDificuldade(event.target.value)}>{DIFICULDADES.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}</Select></FormControl><TextField label="Nota máxima" required type="number" value={notaMaxima} onFocus={(e) => e.target.select()} onChange={(event) => { let val = event.target.value; if (val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) { val = val.replace(/^0+/, '') || '0'; } setNotaMaxima(val); }} inputProps={{ min: 0.01, max: 999.99, step: 0.01 }} /></Box>
      {funcaoUuid && <Typography variant="caption" color="text.secondary">{casos.length} caso{casos.length !== 1 ? 's' : ''} de teste ({casos.filter(c => c.visible).length} visíve{casos.filter(c => c.visible).length !== 1 ? 'is' : 'l'}, {casos.filter(c => c.oculto).length} oculto{casos.filter(c => c.oculto).length !== 1 ? 's' : ''}) será(ão) copiado(s).</Typography>}
    </Box></DialogContent>
    <DialogActions sx={{ px: 3, py: 2 }}><Button onClick={onClose} disabled={saving}>Cancelar</Button><Button variant="contained" onClick={save} disabled={saving || loading || !funcaoUuid}>{saving ? 'Adicionando...' : 'Adicionar função'}</Button></DialogActions>
  </Dialog>;
}

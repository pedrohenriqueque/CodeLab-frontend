/**
 * CasosTesteTable — tabela de casos de teste por função com gestão de visibilidade real.
 *
 * Props:
 *   funcaoUuid: string
 *   parametros: array (ex: [{nome: 'n', tipo: 'int'}])
 *   onUpdate: () => void (callback após salvar)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';

import { getCasosTeste, createCasosTeste, deleteCasoTeste, adaptCasoTeste } from '../api';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';

export default function CasosTesteTable({ funcaoUuid, parametros = [], onUpdate }) {
  const [casos, setCasos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const { showSuccess, showError } = useSnackbar();

  // Estado do formulário de novo caso
  const [novoCaso, setNovoCaso] = useState({
    inputs: {},
    outputEsperado: '',
    peso: '1.00',
    descricao: '',
    oculto: false,
  });

  const fetchCasos = useCallback(async () => {
    if (!funcaoUuid) return;
    setLoading(true);
    try {
      const data = await getCasosTeste(funcaoUuid);
      setCasos(Array.isArray(data) ? data.map(adaptCasoTeste) : []);
    } catch {
      setCasos([]);
    } finally {
      setLoading(false);
    }
  }, [funcaoUuid]);

  useEffect(() => {
    fetchCasos();
  }, [fetchCasos]);

  const openDialog = () => {
    const inputs = {};
    parametros.forEach((p) => {
      inputs[p.nome] = '';
    });
    setNovoCaso({ inputs, outputEsperado: '', peso: '1.00', descricao: '', oculto: false });
    setDialogOpen(true);
  };

  const handleInputChange = (paramName) => (e) => {
    setNovoCaso((prev) => ({
      ...prev,
      inputs: { ...prev.inputs, [paramName]: e.target.value },
    }));
  };

  const handleSave = async () => {
    const peso = Number(novoCaso.peso);
    if (!Number.isFinite(peso) || peso <= 0) {
      showError('Informe um peso maior que zero.');
      return;
    }

    setSaving(true);
    try {
      const parsedInputs = parametros.map((p) => {
        const val = novoCaso.inputs[p.nome];
        if (p.tipo === 'int' || p.tipo === 'long') {
          const n = parseInt(val, 10);
          return isNaN(n) ? val : n;
        }
        if (p.tipo === 'float' || p.tipo === 'double') {
          const n = parseFloat(val);
          return isNaN(n) ? val : n;
        }
        return val;
      });

      const numOut = Number(novoCaso.outputEsperado);
      const parsedOut = isNaN(numOut) ? novoCaso.outputEsperado : numOut;

      await createCasosTeste(funcaoUuid, {
        entradas: parsedInputs,
        retornoEsperado: parsedOut,
        visibilidade: novoCaso.oculto ? 'OCULTO' : 'VISIVEL',
        peso,
        descricao: novoCaso.descricao || '',
      });

      showSuccess('Caso de teste adicionado!');
      setDialogOpen(false);
      await fetchCasos();
      if (onUpdate) onUpdate();
    } catch (err) {
      showError(err.response?.data?.detail || 'Erro ao salvar caso de teste');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (casoUuid) => {
    setDeletingId(casoUuid);
    try {
      await deleteCasoTeste(casoUuid);
      showSuccess('Caso de teste removido!');
      await fetchCasos();
      if (onUpdate) onUpdate();
    } catch (err) {
      showError(err.response?.data?.detail || 'Erro ao remover caso de teste');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Casos de Teste
          <Chip label={casos.length} size="small" sx={{ ml: 1 }} />
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={openDialog}
          variant="outlined"
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Adicionar Caso
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <CircularProgress size={24} />
        </Box>
      ) : casos.length === 0 ? (
        <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
          Nenhum caso de teste cadastrado ainda. Adicione pelo menos um para poder avaliar submissões.
        </Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: 60 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 80 }}>Peso</TableCell>
                {parametros.map((p) => (
                  <TableCell key={p.nome} sx={{ fontWeight: 700 }}>
                    Entrada: <code>{p.nome}</code>
                  </TableCell>
                ))}
                <TableCell sx={{ fontWeight: 700 }}>Saída Esperada</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 120 }}>Visibilidade</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Descrição</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, width: 70 }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {casos.map((caso, idx) => {
                const isOculto = caso.oculto || caso.visibilidade === 'OCULTO';
                const outVal = typeof caso.retornoEsperado === 'object' && caso.retornoEsperado !== null
                  ? (caso.retornoEsperado?.valor ?? JSON.stringify(caso.retornoEsperado))
                  : String(caso.retornoEsperado ?? caso.outputEsperado ?? '');

                return (
                  <TableRow key={caso.uuid || idx} hover>
                    <TableCell>
                      <Chip label={caso.numero || idx + 1} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{Number(caso.peso ?? 1).toFixed(2)}</TableCell>
                    {parametros.map((p, pIdx) => {
                      const val = Array.isArray(caso.entradas) ? caso.entradas[pIdx] : caso.inputs?.[p.nome];
                      return (
                        <TableCell key={p.nome} sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          <code>{val !== undefined ? JSON.stringify(val) : '—'}</code>
                        </TableCell>
                      );
                    })}
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: '#16A34A' }}>
                      <code>{outVal}</code>
                    </TableCell>
                    <TableCell>
                      {isOculto ? (
                        <Chip
                          icon={<VisibilityOffOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                          label="Oculto"
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            backgroundColor: '#F1F5F9',
                            color: '#64748B',
                            borderColor: '#CBD5E1',
                          }}
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          icon={<VisibilityOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                          label="Visível"
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {caso.descricao || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Excluir Caso">
                        <IconButton
                          size="small"
                          color="error"
                          disabled={deletingId === caso.uuid}
                          onClick={() => handleDelete(caso.uuid)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog para novo caso de teste */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Novo Caso de Teste</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {/* Campos de entrada por parâmetro */}
            <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(Math.max(parametros.length, 1), 3)}, 1fr)`, gap: 1.5 }}>
              {parametros.map((p) => (
                <TextField
                  key={p.nome}
                  label={`Entrada: ${p.nome} (${p.tipo})`}
                  value={novoCaso.inputs[p.nome] || ''}
                  onChange={handleInputChange(p.nome)}
                  size="small"
                  fullWidth
                  placeholder={`Valor de ${p.nome}`}
                />
              ))}
            </Box>

            {/* Saída esperada e peso */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 1.5 }}>
              <TextField
                label="Saída Esperada (retorno)"
                value={novoCaso.outputEsperado}
                onChange={(e) => setNovoCaso((prev) => ({ ...prev, outputEsperado: e.target.value }))}
                size="small"
                fullWidth
                required
                placeholder="Valor de retorno esperado"
              />
              <TextField
                label="Peso relativo"
                type="number"
                value={novoCaso.peso}
                onChange={(e) => setNovoCaso((prev) => ({ ...prev, peso: e.target.value }))}
                size="small"
                fullWidth
                required
                inputProps={{ min: 0.01, max: 9999.99, step: 0.01 }}
              />
            </Box>

            {/* Descrição */}
            <TextField
              label="Descrição do Cenário (opcional)"
              value={novoCaso.descricao}
              onChange={(e) => setNovoCaso((prev) => ({ ...prev, descricao: e.target.value }))}
              size="small"
              fullWidth
              placeholder="Ex: Fatorial de zero (caso base)"
            />

            {/* Visibilidade do caso */}
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={novoCaso.oculto}
                    onChange={(e) => setNovoCaso((prev) => ({ ...prev, oculto: e.target.checked }))}
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                      Caso de Teste Oculto
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Os alunos não verão as entradas nem a saída esperada nos resultados de submissão
                    </Typography>
                  </Box>
                }
                sx={{ m: 0 }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || !novoCaso.outputEsperado}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
          >
            {saving ? 'Salvando...' : 'Salvar Caso'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/**
 * FunctionTestCasesDialog — Modal para Gerenciar Casos de Teste Canônicos de uma Função na Biblioteca.
 *
 * Exibe lista de casos, permite adicionar, editar e excluir casos de teste canônicos.
 * Casos de teste na biblioteca NÃO possuem visibilidade global 'oculto'.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import SaveIcon from '@mui/icons-material/Save';

import {
  getCasosTeste,
  createCasosTeste,
  updateCasoTeste,
  deleteCasoTeste,
} from '../api';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';

export default function FunctionTestCasesDialog({ open, onClose, funcao, onUpdated }) {
  const [casos, setCasos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingCaso, setEditingCaso] = useState(null); // null = creating new if formOpen
  const [formOpen, setFormOpen] = useState(false);
  const [formInputs, setFormInputs] = useState({});
  const [formOutput, setFormOutput] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { showSuccess, showError } = useSnackbar();

  const parametros = funcao?.parametros || [];

  const fetchCasos = useCallback(async () => {
    if (!funcao?.uuid) return;
    setLoading(true);
    try {
      const data = await getCasosTeste(funcao.uuid);
      setCasos(Array.isArray(data) ? data : []);
    } catch {
      showError('Erro ao carregar casos de teste da função');
      setCasos([]);
    } finally {
      setLoading(false);
    }
  }, [funcao?.uuid, showError]);

  useEffect(() => {
    if (open && funcao?.uuid) {
      fetchCasos();
      setFormOpen(false);
      setEditingCaso(null);
    }
  }, [open, funcao?.uuid, fetchCasos]);

  const handleOpenCreate = () => {
    const initInputs = {};
    parametros.forEach((p) => {
      initInputs[p.nome] = '';
    });
    setFormInputs(initInputs);
    setFormOutput('');
    setFormDescricao('');
    setEditingCaso(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (caso) => {
    const initInputs = {};
    parametros.forEach((p) => {
      initInputs[p.nome] = caso.inputs?.[p.nome] ?? '';
    });
    setFormInputs(initInputs);
    const outVal = typeof caso.outputEsperado === 'object' && caso.outputEsperado !== null
      ? (caso.outputEsperado?.valor ?? JSON.stringify(caso.outputEsperado))
      : String(caso.outputEsperado ?? '');
    setFormOutput(outVal);
    setFormDescricao(caso.descricao || '');
    setEditingCaso(caso);
    setFormOpen(true);
  };

  const handleSaveCaso = async () => {
    setSaving(true);
    try {
      const parsedInputs = {};
      parametros.forEach((p) => {
        const val = formInputs[p.nome];
        if (p.tipo === 'int' || p.tipo === 'long') {
          const n = parseInt(val, 10);
          parsedInputs[p.nome] = isNaN(n) ? val : n;
        } else if (p.tipo === 'float' || p.tipo === 'double') {
          const n = parseFloat(val);
          parsedInputs[p.nome] = isNaN(n) ? val : n;
        } else {
          parsedInputs[p.nome] = val;
        }
      });

      const retTipo = funcao?.retorno?.tipo || funcao?.retorno || 'int';
      let parsedOut = formOutput;
      if (retTipo === 'int' || retTipo === 'long') {
        const n = parseInt(formOutput, 10);
        parsedOut = isNaN(n) ? formOutput : n;
      } else if (retTipo === 'float' || retTipo === 'double') {
        const n = parseFloat(formOutput);
        parsedOut = isNaN(n) ? formOutput : n;
      }

      const body = {
        inputs: parsedInputs,
        outputEsperado: { valor: parsedOut },
        descricao: formDescricao.trim() || null,
      };

      if (editingCaso?.uuid) {
        await updateCasoTeste(funcao.uuid, editingCaso.uuid, body);
        showSuccess('Caso de teste atualizado com sucesso!');
      } else {
        await createCasosTeste(funcao.uuid, body);
        showSuccess('Caso de teste criado com sucesso!');
      }

      setFormOpen(false);
      await fetchCasos();
      if (onUpdated) onUpdated();
    } catch (err) {
      showError(err.response?.data?.detail || 'Erro ao salvar caso de teste');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCaso = async (casoUuid) => {
    setDeletingId(casoUuid);
    try {
      await deleteCasoTeste(funcao.uuid, casoUuid);
      showSuccess('Caso de teste removido!');
      await fetchCasos();
      if (onUpdated) onUpdated();
    } catch (err) {
      showError(err.response?.data?.detail || 'Erro ao excluir caso de teste');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        Casos de Teste — <code>{funcao?.nomeFuncao || funcao?.nome_funcao}()</code>
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: '#E2E8F0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Casos de teste canônicos cadastrados na biblioteca para esta função.
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
          >
            Adicionar Caso
          </Button>
        </Box>

        {/* Formulário inline para novo/edição */}
        {formOpen && (
          <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2.5, backgroundColor: '#F8FAFC' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#1E293B' }}>
              {editingCaso ? `Editar Caso #${editingCaso.numero}` : 'Novo Caso de Teste'}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Inputs por parâmetro */}
              <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(parametros.length, 3)}, 1fr)`, gap: 1.5 }}>
                {parametros.map((p) => (
                  <TextField
                    key={p.nome}
                    label={`Entrada: ${p.nome} (${p.tipo})`}
                    value={formInputs[p.nome] ?? ''}
                    onChange={(e) => setFormInputs((prev) => ({ ...prev, [p.nome]: e.target.value }))}
                    size="small"
                    required
                    fullWidth
                    placeholder={`Valor de ${p.nome}`}
                    sx={{ backgroundColor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                ))}
              </Box>

              {/* Saída esperada e Descrição */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 1.5 }}>
                <TextField
                  label="Saída Esperada (retorno)"
                  value={formOutput}
                  onChange={(e) => setFormOutput(e.target.value)}
                  size="small"
                  required
                  fullWidth
                  placeholder="Ex: 120"
                  sx={{ backgroundColor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <TextField
                  label="Descrição do Cenário (opcional)"
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  size="small"
                  fullWidth
                  placeholder="Ex: Fatorial de zero (caso base)"
                  sx={{ backgroundColor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                <Button size="small" onClick={() => setFormOpen(false)} disabled={saving} sx={{ textTransform: 'none' }}>
                  Cancelar
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSaveCaso}
                  disabled={saving || formOutput === ''}
                  startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />}
                  sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
                >
                  {saving ? 'Salvando...' : 'Salvar Caso'}
                </Button>
              </Box>
            </Box>
          </Paper>
        )}

        {/* Tabela de casos */}
        {loading ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <CircularProgress size={30} />
          </Box>
        ) : casos.length === 0 ? (
          <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
            Esta função ainda não possui casos de teste canônicos cadastrados. Clique em "Adicionar Caso" acima.
          </Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5 }}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: 60 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Entradas</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Saída Esperada</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Descrição</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, width: 100 }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {casos.map((caso, idx) => {
                  const inputStr = parametros.length
                    ? parametros.map((p) => `${p.nome} = ${caso.inputs?.[p.nome] ?? ''}`).join(', ')
                    : JSON.stringify(caso.inputs ?? {});

                  const outVal = typeof caso.outputEsperado === 'object' && caso.outputEsperado !== null
                    ? (caso.outputEsperado?.valor ?? JSON.stringify(caso.outputEsperado))
                    : String(caso.outputEsperado ?? '');

                  return (
                    <TableRow key={caso.uuid || idx} hover>
                      <TableCell>
                        <Chip label={caso.numero || idx + 1} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {inputStr}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: '#16A34A' }}>
                        {outVal}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                        {caso.descricao || '—'}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Editar Caso">
                          <IconButton size="small" onClick={() => handleOpenEdit(caso)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir Caso">
                          <IconButton
                            size="small"
                            color="error"
                            disabled={deletingId === caso.uuid}
                            onClick={() => handleDeleteCaso(caso.uuid)}
                          >
                            <DeleteOutlineOutlinedIcon fontSize="small" />
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
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

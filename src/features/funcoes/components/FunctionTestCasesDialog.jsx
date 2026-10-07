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
  Switch,
  FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import {
  getCasosTeste,
  createCasosTeste,
  updateCasoTeste,
  deleteCasoTeste,
  adaptCasoTeste,
} from '../api';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';
import { useAuth } from '../../auth/hooks/useAuthProvider';
import TestCaseInputs from '../../../shared/components/TestCaseInputs';
import { formatTestCaseValue, parseTestCaseValue } from '../../../shared/components/testCaseValues';

export default function FunctionTestCasesDialog({ open, onClose, funcao, onUpdated }) {
  const [casos, setCasos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingCaso, setEditingCaso] = useState(null); // null = creating new if formOpen
  const [formOpen, setFormOpen] = useState(false);
  const [formInputs, setFormInputs] = useState({});
  const [formOutput, setFormOutput] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formPeso, setFormPeso] = useState('1.00');
  const [formOculto, setFormOculto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { showSuccess, showError } = useSnackbar();
  const { user } = useAuth();

  const parametros = funcao?.parametros || [];
  const isAutor = Boolean(user?.uuid && user.uuid === funcao?.professorUuid);

  const fetchCasos = useCallback(async () => {
    if (!funcao?.uuid) return;
    setLoading(true);
    try {
      const data = await getCasosTeste(funcao.uuid);
      setCasos(Array.isArray(data) ? data.map(adaptCasoTeste) : []);
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
    setFormPeso('1.00');
    setFormOculto(false);
    setEditingCaso(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (caso) => {
    const initInputs = {};
    parametros.forEach((p, index) => {
      const value = caso.entradas?.[index];
      initInputs[p.nome] = typeof value === 'string' ? value : value === undefined ? '' : JSON.stringify(value);
    });
    setFormInputs(initInputs);
    const outVal = typeof caso.retornoEsperado === 'object' ? JSON.stringify(caso.retornoEsperado) : String(caso.retornoEsperado ?? '');
    setFormOutput(outVal);
    setFormDescricao(caso.descricao || '');
    setFormPeso(Number(caso.peso ?? 1).toFixed(2));
    setFormOculto(caso.oculto || caso.visibilidade === 'OCULTO');
    setEditingCaso(caso);
    setFormOpen(true);
  };

  const handleSaveCaso = async () => {
    const peso = Number(formPeso);
    if (!Number.isFinite(peso) || peso <= 0) {
      showError('Informe um peso maior que zero.');
      return;
    }

    setSaving(true);
    try {
      const parsedInputs = parametros.map((p) => {
        try {
          return parseTestCaseValue(formInputs[p.nome], p.tipo);
        } catch (err) {
          throw new Error(`${p.nome}: ${err.message}`, { cause: err });
        }
      });
      const parsedOut = parseTestCaseValue(formOutput, funcao?.tipoRetorno || 'int');

      const body = {
        entradas: parsedInputs,
        retornoEsperado: parsedOut,
        visibilidade: formOculto ? 'OCULTO' : 'VISIVEL',
        peso,
        descricao: formDescricao,
      };

      if (editingCaso?.uuid) {
        await updateCasoTeste(editingCaso.uuid, body);
        showSuccess('Caso de teste atualizado com sucesso!');
      } else {
        await createCasosTeste(funcao.uuid, body);
        showSuccess('Caso de teste criado com sucesso!');
      }

      setFormOpen(false);
      await fetchCasos();
      if (onUpdated) onUpdated();
    } catch (err) {
      showError(err.response?.data?.erro || err.response?.data?.detail || err.message || 'Erro ao salvar caso de teste');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCaso = async (casoUuid) => {
    setDeletingId(casoUuid);
    try {
      await deleteCasoTeste(casoUuid);
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
        Casos de Teste — <code>{funcao?.nome}()</code>
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: '#E2E8F0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Casos de teste canônicos cadastrados na biblioteca para esta função.
          </Typography>
          {isAutor && <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
          >
            Adicionar Caso
          </Button>}
        </Box>
        {!isAutor && <Alert severity="info" variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>Você pode consultar estes casos porque a função é compartilhada. Duplique-a para criar ou alterar casos.</Alert>}

        {/* Formulário inline para novo/edição */}
        {formOpen && (
          <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2.5, backgroundColor: '#F8FAFC' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#1E293B' }}>
              {editingCaso ? `Editar Caso #${editingCaso.numero}` : 'Novo Caso de Teste'}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Inputs por parâmetro */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: `repeat(${Math.max(1, Math.min(parametros.length, 3))}, minmax(0, 1fr))` }, gap: 1.5 }}>
                {parametros.map((p) => (
                  <TextField
                    key={p.nome}
                    label={`Entrada: ${p.nome} (${p.tipo})`}
                    value={formInputs[p.nome] ?? ''}
                    onChange={(e) => setFormInputs((prev) => ({ ...prev, [p.nome]: e.target.value }))}
                    size="small"
                    required
                    fullWidth
                    placeholder={p.tipo.endsWith('[]') ? '[1, 2, 3]' : p.tipo === 'bool' ? 'true ou false' : `Valor de ${p.nome}`}
                    helperText={p.tipo.endsWith('[]') ? 'Vetor em formato JSON' : p.tipo === 'bool' ? 'Use true ou false' : undefined}
                    sx={{ backgroundColor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                ))}
              </Box>

              {/* Saída esperada, peso e descrição */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 0.7fr 2fr' }, gap: 1.5 }}>
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
                  label="Peso relativo"
                  type="number"
                  value={formPeso}
                  onChange={(e) => setFormPeso(e.target.value)}
                  size="small"
                  required
                  fullWidth
                  inputProps={{ min: 0.01, max: 999999.99, step: 0.01 }}
                  helperText="Usado proporcionalmente na nota da função"
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

              {/* Visibilidade do caso */}
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formOculto}
                      onChange={(e) => setFormOculto(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        Caso de Teste Oculto
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        (os alunos não verão as entradas nem a saída esperada nos resultados de submissão)
                      </Typography>
                    </Box>
                  }
                  sx={{ m: 0 }}
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
                  disabled={saving || (formOutput === '' && funcao?.tipoRetorno !== 'string')}
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
            {isAutor
              ? 'Esta função ainda não possui casos de teste canônicos cadastrados. Clique em "Adicionar Caso" acima.'
              : 'Esta função compartilhada ainda não possui casos de teste. Duplique-a para criar casos na sua cópia.'}
          </Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5 }}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: 60 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 100 }}>Peso</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Entradas</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Saída Esperada</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 115 }}>Visibilidade</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Descrição</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, width: 100 }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {casos.map((caso, idx) => {
                  const outVal = formatTestCaseValue(caso.retornoEsperado);

                  return (
                    <TableRow key={caso.uuid || idx} hover>
                      <TableCell>
                        <Chip label={caso.numero || idx + 1} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{Number(caso.peso ?? 1).toFixed(2)}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        <TestCaseInputs entradas={caso.entradas} parametros={parametros} />
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: '#16A34A' }}>
                        {outVal}
                      </TableCell>
                      <TableCell>
                        {(caso.oculto || caso.visibilidade === 'OCULTO') ? (
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
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                        {caso.descricao || '—'}
                      </TableCell>
                      <TableCell align="right">
                        {isAutor && <>
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
                        </>}
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

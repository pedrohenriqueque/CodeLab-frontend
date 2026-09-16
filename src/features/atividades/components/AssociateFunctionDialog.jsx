import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import { getBibliotecaFuncoes, getCasosTeste } from '../../funcoes/api';
import { associarFuncaoAtividade, atualizarFuncaoAtividade } from '../api';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';

const DIFICULDADES = [
  { value: 'facil', label: 'Fácil', color: 'success' },
  { value: 'medio', label: 'Médio', color: 'warning' },
  { value: 'dificil', label: 'Difícil', color: 'error' },
];

export default function AssociateFunctionDialog({
  open,
  onClose,
  atividadeUuid,
  existingFuncaoUuids = [],
  editingAssociation = null, // if provided, editing existing association
  onSaved,
}) {
  const { showSuccess, showError } = useSnackbar();

  const [loadingLib, setLoadingLib] = useState(false);
  const [biblioteca, setBiblioteca] = useState([]);
  const [selectedFuncaoUuid, setSelectedFuncaoUuid] = useState('');
  const [selectedFuncao, setSelectedFuncao] = useState(null);

  // Config parameters
  const [dificuldade, setDificuldade] = useState('facil');
  const [peso, setPeso] = useState(10);
  const [ordem, setOrdem] = useState(0);

  // Test cases config
  const [loadingCasos, setLoadingCasos] = useState(false);
  const [casosTeste, setCasosTeste] = useState([]);
  const [casosConfig, setCasosConfig] = useState({}); // { [casoUuid]: { included: bool, oculto: bool } }

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (editingAssociation) {
      // Editing existing association
      setSelectedFuncaoUuid(editingAssociation.funcaoUuid);
      setSelectedFuncao(editingAssociation);
      setDificuldade(editingAssociation.dificuldade || editingAssociation.dificuldadePadrao || 'facil');
      setPeso(editingAssociation.peso ?? 10);
      setOrdem(editingAssociation.ordem ?? 0);

      // Load canonical test cases for the function and merge contextual visibility
      setLoadingCasos(true);
      getCasosTeste(editingAssociation.funcaoUuid)
        .then((allCasos) => {
          setCasosTeste(allCasos);
          const initialMap = {};
          const currentConfigMap = {};
          (editingAssociation.casosTeste || []).forEach((ct) => {
            currentConfigMap[ct.casoTesteUuid] = ct.oculto;
          });

          allCasos.forEach((c) => {
            const isConfigured = c.uuid in currentConfigMap;
            initialMap[c.uuid] = {
              included: isConfigured || editingAssociation.casosTeste?.length === 0,
              oculto: isConfigured ? currentConfigMap[c.uuid] : false,
            };
          });
          setCasosConfig(initialMap);
        })
        .catch(() => setCasosTeste([]))
        .finally(() => setLoadingCasos(false));
    } else {
      // Adding new function
      setSelectedFuncaoUuid('');
      setSelectedFuncao(null);
      setDificuldade('facil');
      setPeso(10);
      setOrdem(existingFuncaoUuids.length);
      setCasosTeste([]);
      setCasosConfig({});

      setLoadingLib(true);
      getBibliotecaFuncoes()
        .then((res) => {
          setBiblioteca(res.items || res || []);
        })
        .catch((err) => showError('Erro ao carregar biblioteca de funções'))
        .finally(() => setLoadingLib(false));
    }
  }, [open, editingAssociation]);

  const handleSelectFuncao = async (e) => {
    const fUuid = e.target.value;
    setSelectedFuncaoUuid(fUuid);
    const func = biblioteca.find((f) => f.uuid === fUuid);
    setSelectedFuncao(func || null);

    if (func) {
      setDificuldade(func.dificuldadePadrao || 'facil');
      setLoadingCasos(true);
      try {
        const casos = await getCasosTeste(func.uuid);
        setCasosTeste(casos);
        const map = {};
        casos.forEach((c) => {
          map[c.uuid] = { included: true, oculto: false };
        });
        setCasosConfig(map);
      } catch (err) {
        showError('Erro ao buscar casos de teste da função');
      } finally {
        setLoadingCasos(false);
      }
    } else {
      setCasosTeste([]);
      setCasosConfig({});
    }
  };

  const handleToggleIncluded = (casoUuid) => {
    setCasosConfig((prev) => ({
      ...prev,
      [casoUuid]: {
        ...prev[casoUuid],
        included: !prev[casoUuid]?.included,
      },
    }));
  };

  const handleChangeVisibility = (casoUuid, oculto) => {
    setCasosConfig((prev) => ({
      ...prev,
      [casoUuid]: {
        ...prev[casoUuid],
        oculto,
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedFuncaoUuid) {
      showError('Selecione uma função da biblioteca.');
      return;
    }

    setSaving(true);
    try {
      const selectedCasosList = Object.entries(casosConfig)
        .filter(([, cfg]) => cfg.included)
        .map(([casoUuid, cfg]) => ({
          casoTesteUuid: casoUuid,
          oculto: cfg.oculto,
        }));

      if (editingAssociation) {
        await atualizarFuncaoAtividade(atividadeUuid, editingAssociation.funcaoUuid, {
          dificuldade,
          peso: Number(peso),
          ordem: Number(ordem),
          casosTeste: selectedCasosList,
        });
        showSuccess('Parâmetros da função atualizados com sucesso!');
      } else {
        await associarFuncaoAtividade(atividadeUuid, {
          funcaoUuid: selectedFuncaoUuid,
          dificuldade,
          peso: Number(peso),
          ordem: Number(ordem),
          casosTeste: selectedCasosList,
        });
        showSuccess('Função associada à atividade com sucesso!');
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      showError(err.response?.data?.detail || 'Erro ao salvar associação de função');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        {editingAssociation ? 'Configurar Função na Atividade' : 'Associar Função da Biblioteca'}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          {/* Function Selection */}
          {!editingAssociation ? (
            <FormControl fullWidth size="small">
              <InputLabel id="select-lib-label">Função da Biblioteca</InputLabel>
              <Select
                labelId="select-lib-label"
                label="Função da Biblioteca"
                value={selectedFuncaoUuid}
                onChange={handleSelectFuncao}
                disabled={loadingLib}
              >
                {loadingLib ? (
                  <MenuItem disabled>Carregando funções...</MenuItem>
                ) : (
                  biblioteca.map((f) => {
                    const isAlreadyAdded = existingFuncaoUuids.includes(f.uuid);
                    return (
                      <MenuItem key={f.uuid} value={f.uuid} disabled={isAlreadyAdded}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                            {f.nomeFuncao}()
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip
                              label={f.dificuldadePadrao}
                              size="small"
                              color={f.dificuldadePadrao === 'facil' ? 'success' : f.dificuldadePadrao === 'medio' ? 'warning' : 'error'}
                              variant="outlined"
                            />
                            {isAlreadyAdded && <Chip label="Já associada" size="small" color="default" />}
                          </Box>
                        </Box>
                      </MenuItem>
                    );
                  })
                )}
              </Select>
            </FormControl>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                {editingAssociation.nomeFuncao}()
              </Typography>
              <Chip
                label={`Padrão: ${editingAssociation.dificuldadePadrao || 'facil'}`}
                size="small"
                variant="outlined"
              />
            </Box>
          )}

          {selectedFuncao && (
            <>
              {/* Contextual parameters: dificuldade, peso, ordem */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Dificuldade nesta Atividade</InputLabel>
                  <Select
                    label="Dificuldade nesta Atividade"
                    value={dificuldade}
                    onChange={(e) => setDificuldade(e.target.value)}
                  >
                    {DIFICULDADES.map((d) => (
                      <MenuItem key={d.value} value={d.value}>
                        {d.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Pontuação / Peso"
                  type="number"
                  size="small"
                  value={peso}
                  onChange={(e) => setPeso(Math.max(0, Number(e.target.value)))}
                  inputProps={{ step: 1, min: 0 }}
                />

                <TextField
                  label="Ordem na Atividade"
                  type="number"
                  size="small"
                  value={ordem}
                  onChange={(e) => setOrdem(Math.max(0, Number(e.target.value)))}
                  inputProps={{ step: 1, min: 0 }}
                />
              </Box>

              <Divider />

              {/* Contextual test cases */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Casos de Teste Contextuais ({casosTeste.length})
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Selecione quais casos de teste desta função serão aplicados nesta atividade e a visibilidade de cada um para o aluno.
                </Typography>

                {loadingCasos ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : casosTeste.length === 0 ? (
                  <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                    Esta função não possui casos de teste cadastrados na biblioteca.
                  </Alert>
                ) : (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: 'action.hover' }}>
                        <TableRow>
                          <TableCell padding="checkbox">
                            <Checkbox
                              indeterminate={
                                Object.values(casosConfig).some((c) => c.included) &&
                                !Object.values(casosConfig).every((c) => c.included)
                              }
                              checked={
                                casosTeste.length > 0 &&
                                Object.values(casosConfig).every((c) => c.included)
                              }
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setCasosConfig((prev) => {
                                  const updated = { ...prev };
                                  casosTeste.forEach((c) => {
                                    updated[c.uuid] = { ...updated[c.uuid], included: checked };
                                  });
                                  return updated;
                                });
                              }}
                            />
                          </TableCell>
                          <TableCell>#</TableCell>
                          <TableCell>Inputs</TableCell>
                          <TableCell>Saída Esperada</TableCell>
                          <TableCell>Visibilidade nesta Atividade</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {casosTeste.map((caso) => {
                          const config = casosConfig[caso.uuid] || { included: true, oculto: false };
                          return (
                            <TableRow key={caso.uuid} sx={{ opacity: config.included ? 1 : 0.4 }}>
                              <TableCell padding="checkbox">
                                <Checkbox
                                  checked={!!config.included}
                                  onChange={() => handleToggleIncluded(caso.uuid)}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                  #{caso.numero}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                {JSON.stringify(caso.inputs)}
                              </TableCell>
                              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                {JSON.stringify(caso.outputEsperado)}
                              </TableCell>
                              <TableCell>
                                <RadioGroup
                                  row
                                  value={config.oculto ? 'oculto' : 'visivel'}
                                  onChange={(e) =>
                                    handleChangeVisibility(caso.uuid, e.target.value === 'oculto')
                                  }
                                >
                                  <FormControlLabel
                                    value="visivel"
                                    control={<Radio size="small" />}
                                    disabled={!config.included}
                                    label={
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <VisibilityIcon fontSize="inherit" color="success" />
                                        <Typography variant="caption">Visível</Typography>
                                      </Box>
                                    }
                                  />
                                  <FormControlLabel
                                    value="oculto"
                                    control={<Radio size="small" />}
                                    disabled={!config.included}
                                    label={
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <VisibilityOffIcon fontSize="inherit" color="action" />
                                        <Typography variant="caption">Oculto</Typography>
                                      </Box>
                                    }
                                  />
                                </RadioGroup>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !selectedFuncaoUuid}
        >
          {saving ? 'Salvando...' : editingAssociation ? 'Salvar Alterações' : 'Associar Função'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

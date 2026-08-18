/**
 * CasosTesteTable — tabela editável de casos de teste por função.
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';

import { getCasosTeste, createCasosTeste } from '../api';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';

export default function CasosTesteTable({ funcaoUuid, parametros = [] }) {
  const [casos, setCasos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useSnackbar();

  // Estado do formulário de novo caso
  const [novoCaso, setNovoCaso] = useState({
    inputs: {},
    outputEsperado: '',
    descricao: '',
  });

  const fetchCasos = useCallback(async () => {
    if (!funcaoUuid) return;
    setLoading(true);
    try {
      const data = await getCasosTeste(funcaoUuid);
      setCasos(Array.isArray(data) ? data : [data]);
    } catch {
      // silêncio — pode não ter casos ainda
      setCasos([]);
    } finally {
      setLoading(false);
    }
  }, [funcaoUuid]);

  useEffect(() => {
    fetchCasos();
  }, [fetchCasos]);

  const openDialog = () => {
    // Inicializa inputs com os nomes dos parâmetros
    const inputs = {};
    parametros.forEach((p) => {
      inputs[p.nome] = '';
    });
    setNovoCaso({ inputs, outputEsperado: '', descricao: '' });
    setDialogOpen(true);
  };

  const handleInputChange = (paramName) => (e) => {
    setNovoCaso((prev) => ({
      ...prev,
      inputs: { ...prev.inputs, [paramName]: e.target.value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Converter inputs para números quando possível
      const parsedInputs = {};
      Object.entries(novoCaso.inputs).forEach(([key, val]) => {
        const num = Number(val);
        parsedInputs[key] = isNaN(num) ? val : num;
      });

      const outputNum = Number(novoCaso.outputEsperado);
      const outputVal = isNaN(outputNum) ? novoCaso.outputEsperado : outputNum;

      await createCasosTeste(funcaoUuid, {
        inputs: parsedInputs,
        outputEsperado: { valor: outputVal },
        descricao: novoCaso.descricao || null,
      });

      showSuccess('Caso de teste adicionado!');
      setDialogOpen(false);
      fetchCasos();
    } catch (err) {
      showError(err.response?.data?.detail || 'Erro ao salvar caso de teste');
    } finally {
      setSaving(false);
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
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                {parametros.map((p) => (
                  <TableCell key={p.nome}>
                    Entrada: <code>{p.nome}</code>
                  </TableCell>
                ))}
                <TableCell>Saída Esperada</TableCell>
                <TableCell>Descrição</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {casos.map((caso, idx) => (
                <TableRow key={caso.uuid || idx}>
                  <TableCell>
                    <Chip label={caso.numero || idx + 1} size="small" variant="outlined" />
                  </TableCell>
                  {parametros.map((p) => (
                    <TableCell key={p.nome}>
                      <code>{JSON.stringify(caso.inputs?.[p.nome] ?? caso.inputs?.[p.nome])}</code>
                    </TableCell>
                  ))}
                  <TableCell>
                    <code>
                      {typeof caso.outputEsperado === 'object'
                        ? JSON.stringify(caso.outputEsperado?.valor ?? caso.outputEsperado)
                        : caso.outputEsperado}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {caso.descricao || '—'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog para novo caso de teste */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Novo Caso de Teste</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {/* Campos de entrada por parâmetro */}
            {parametros.map((p) => (
              <TextField
                key={p.nome}
                label={`Entrada: ${p.nome} (${p.tipo})`}
                value={novoCaso.inputs[p.nome] || ''}
                onChange={handleInputChange(p.nome)}
                fullWidth
                placeholder={`Valor de ${p.nome}`}
              />
            ))}

            {/* Saída esperada */}
            <TextField
              label="Saída Esperada"
              value={novoCaso.outputEsperado}
              onChange={(e) => setNovoCaso((prev) => ({ ...prev, outputEsperado: e.target.value }))}
              fullWidth
              placeholder="Valor de retorno esperado"
            />

            {/* Descrição */}
            <TextField
              label="Descrição (opcional)"
              value={novoCaso.descricao}
              onChange={(e) => setNovoCaso((prev) => ({ ...prev, descricao: e.target.value }))}
              fullWidth
              placeholder="Ex: 5! = 120"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || !novoCaso.outputEsperado}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

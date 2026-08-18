import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CodeIcon from '@mui/icons-material/Code';
import { sandboxApi } from '../api';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';

export default function SandboxPage() {
  const [codigo, setCodigo] = useState('#include <stdio.h>\n\nint main() {\n    printf("Hello World!\\n");\n    return 0;\n}');
  const [submitting, setSubmitting] = useState(false);
  const [resultado, setResultado] = useState(null);
  const { showError } = useSnackbar();

  const handleRun = async () => {
    if (!codigo.trim()) return;
    setSubmitting(true);
    setResultado(null);
    try {
      const res = await sandboxApi.executarCodigo(codigo);
      setResultado(res);
    } catch (err) {
      showError(err.response?.data?.detail || 'Erro ao executar o código.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    setCodigo('#include <stdio.h>\n\nint main() {\n    printf("Hello World!\\n");\n    return 0;\n}');
    setResultado(null);
  };

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CodeIcon fontSize="large" color="primary" />
          Playground (C)
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Escreva e teste seu código livremente, sem avaliação.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Código-fonte
          </Typography>
          <Card variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box
              component="textarea"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              spellCheck={false}
              sx={{
                width: '100%',
                minHeight: 450,
                p: 2,
                border: 'none',
                outline: 'none',
                fontFamily: "'Consolas', 'Courier New', monospace",
                fontSize: '0.875rem',
                lineHeight: 1.7,
                backgroundColor: '#1E1E2E',
                color: '#CDD6F4',
                resize: 'vertical',
                tabSize: 4,
              }}
            />
          </Card>

          <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
              onClick={handleRun}
              disabled={submitting || !codigo.trim()}
              sx={{ flex: 1, py: 1.3 }}
            >
              {submitting ? 'Executando...' : 'Rodar Código'}
            </Button>
            <Button
              variant="text"
              startIcon={<RestartAltIcon />}
              onClick={handleClear}
              disabled={submitting}
            >
              Restaurar
            </Button>
          </Box>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Terminal / Saída
          </Typography>
          
          <Card variant="outlined" sx={{ borderRadius: 2, minHeight: 450, backgroundColor: '#0D0D12' }}>
            <CardContent>
              {submitting ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 2 }}>
                  <CircularProgress size={40} color="secondary" />
                  <Typography variant="body2" sx={{ color: '#A0A0A0' }}>
                    Aguardando execução...
                  </Typography>
                </Box>
              ) : resultado ? (
                <Box sx={{ fontFamily: "'Consolas', monospace", fontSize: '0.875rem' }}>
                  {resultado.compile_output && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ color: '#F38BA8', fontWeight: 'bold' }}>Compilador:</Typography>
                      <Box sx={{ color: '#F38BA8', whiteSpace: 'pre-wrap', mt: 0.5 }}>
                        {resultado.compile_output}
                      </Box>
                    </Box>
                  )}
                  {resultado.stderr && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ color: '#F38BA8', fontWeight: 'bold' }}>Erro Padrão (stderr):</Typography>
                      <Box sx={{ color: '#F38BA8', whiteSpace: 'pre-wrap', mt: 0.5 }}>
                        {resultado.stderr}
                      </Box>
                    </Box>
                  )}
                  {resultado.stdout && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ color: '#A6E3A1', fontWeight: 'bold' }}>Saída Padrão (stdout):</Typography>
                      <Box sx={{ color: '#CDD6F4', whiteSpace: 'pre-wrap', mt: 0.5 }}>
                        {resultado.stdout}
                      </Box>
                    </Box>
                  )}
                  {!resultado.compile_output && !resultado.stderr && !resultado.stdout && (
                    <Typography variant="body2" sx={{ color: '#A0A0A0', fontStyle: 'italic' }}>
                      (Programa finalizado sem saída visível)
                    </Typography>
                  )}
                  
                  <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
                  
                  <Box sx={{ display: 'flex', gap: 2, color: '#A0A0A0', fontSize: '0.75rem' }}>
                    <span>Status: <strong style={{ color: resultado.status === 'Accepted' ? '#A6E3A1' : '#F38BA8' }}>{resultado.status}</strong></span>
                    {resultado.time && <span>Tempo: <strong>{resultado.time}s</strong></span>}
                    {resultado.memory && <span>Memória: <strong>{resultado.memory}KB</strong></span>}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="body1" sx={{ color: '#505050', fontFamily: "'Consolas', monospace" }}>
                    $ A saída do console aparecerá aqui.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}

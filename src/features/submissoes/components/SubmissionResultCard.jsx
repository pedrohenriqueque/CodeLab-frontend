/**
 * SubmissionResultCard — exibe resultado de uma submissão.
 *
 * Mostra: nota, barra de progresso, lista de casos (PASS/FAIL), erros.
 * Props: resultado (object do backend)
 */

import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Divider,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export default function SubmissionResultCard({ resultado, feedbackProfessor }) {
  if (!resultado) return null;

  const {
    nota = 0,
    pontosMaximo,
    totalCasos = 0,
    casosPassados = 0,
    casos = [],
    erroCompilacao,
    erroExecucao,
    tempoMs = 0,
    memoriaKb = 0,
  } = resultado;

  const porcentagem = pontosMaximo > 0 ? (nota / pontosMaximo) * 100 : 0;
  const allPassed = casosPassados === totalCasos && totalCasos > 0;
  const hasError = erroCompilacao || erroExecucao;

  return (
    <Card
      sx={{
        border: '2px solid',
        borderColor: hasError ? 'error.main' : allPassed ? 'success.main' : 'warning.main',
      }}
    >
      <CardContent>
        {/* Header com nota */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {allPassed ? (
              <CheckCircleIcon color="success" sx={{ fontSize: 32 }} />
            ) : hasError ? (
              <CancelIcon color="error" sx={{ fontSize: 32 }} />
            ) : (
              <WarningAmberIcon color="warning" sx={{ fontSize: 32 }} />
            )}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {allPassed ? 'Todos os testes passaram!' : hasError ? 'Erro na submissão' : 'Aprovação parcial'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {casosPassados}/{totalCasos} casos • {tempoMs}ms • {memoriaKb}KB
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: allPassed ? 'success.main' : hasError ? 'error.main' : 'warning.main' }}>
              {nota}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              / {pontosMaximo} pts
            </Typography>
          </Box>
        </Box>

        {/* Barra de progresso */}
        <LinearProgress
          variant="determinate"
          value={porcentagem}
          color={allPassed ? 'success' : hasError ? 'error' : 'warning'}
          sx={{ mb: 2, height: 8, borderRadius: 4 }}
        />

        {/* Erros */}
        {erroCompilacao && (
          <Alert
            severity="error"
            variant="outlined"
            sx={{ mb: 2, borderRadius: 2, '& .MuiAlert-message': { fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'pre-wrap' } }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Erro de Compilação
            </Typography>
            {erroCompilacao}
          </Alert>
        )}

        {erroExecucao && (
          <Alert
            severity="error"
            variant="outlined"
            sx={{ mb: 2, borderRadius: 2, '& .MuiAlert-message': { fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'pre-wrap' } }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Erro de Execução
            </Typography>
            {erroExecucao}
          </Alert>
        )}

        {feedbackProfessor && (
          <Alert
            severity="info"
            icon={false}
            sx={{ mb: 2, borderRadius: 2, backgroundColor: 'rgba(25, 118, 210, 0.08)', border: '1px solid #1976d2' }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1976d2', mb: 0.5 }}>
              Comentário do Professor
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary' }}>
              {feedbackProfessor}
            </Typography>
          </Alert>
        )}

        {/* Lista de casos */}
        {casos.length > 0 && (
          <>
            <Divider sx={{ mb: 1.5 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Detalhes dos Casos
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {casos.map((caso) => (
                <Box
                  key={caso.numero}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    py: 0.75,
                    px: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: caso.status === 'PASS' ? 'rgba(46,125,50,0.04)' : 'rgba(211,47,47,0.04)',
                  }}
                >
                  {caso.status === 'PASS' ? (
                    <CheckCircleIcon color="success" fontSize="small" />
                  ) : (
                    <CancelIcon color="error" fontSize="small" />
                  )}
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Caso {caso.numero}
                  </Typography>
                  <Chip
                    label={caso.status}
                    size="small"
                    color={caso.status === 'PASS' ? 'success' : 'error'}
                    variant="outlined"
                  />
                  {caso.status === 'FAIL' && caso.expected && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      esperado: {caso.expected} | obtido: {caso.got}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}

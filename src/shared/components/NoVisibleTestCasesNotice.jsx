import { Alert } from '@mui/material';

export default function NoVisibleTestCasesNotice() {
  return (
    <Alert severity="info" variant="outlined">
      Não há casos de teste visíveis para consulta. A correção automática utiliza os casos cadastrados pelo professor. Use o enunciado e a assinatura para preparar sua solução.
    </Alert>
  );
}

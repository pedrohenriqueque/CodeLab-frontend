export const STATUS = {
  PROCESSANDO: { label: 'Aguardando correção', color: 'warning' },
  AVALIADA: { label: 'Avaliada', color: 'success' },
  ERRO_COMPILACAO: { label: 'Erro de compilação', color: 'error' },
  FALHA_TECNICA: { label: 'Falha técnica', color: 'error' },
  ASSINATURA_NAO_SUPORTADA: { label: 'Assinatura não suportada', color: 'error' },
};

export const FILTERABLE_STATUSES = ['AVALIADA', 'PROCESSANDO', 'ERRO_COMPILACAO', 'FALHA_TECNICA'];

export const statusInfo = (status) => STATUS[status] || { label: status || 'Desconhecido', color: 'default' };

export function formatSubmissionDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function formatScore(value, maximum) {
  if (value == null) return '—';
  const score = Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return maximum == null ? score : `${score} / ${Number(maximum).toLocaleString('pt-BR')}`;
}

/**
 * StudentActivityDetailPage — detalhe de atividade para o aluno.
 *
 * Lista funções com enunciado e botão para submeter código.
 */

import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Breadcrumbs,
  Link,
  Skeleton,
  Alert,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CodeIcon from '@mui/icons-material/Code';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import useAtividadeDetail from '../hooks/useAtividadeDetail';
import useProgresso from '../hooks/useProgresso';

const DIFICULDADE_COLORS = {
  facil: 'success',
  medio: 'warning',
  dificil: 'error',
};

const DIFICULDADE_LABELS = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
};

export default function StudentActivityDetailPage() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { atividade, loading, error } = useAtividadeDetail(uuid);
  const { progresso } = useProgresso();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Skeleton variant="text" width={200} height={32} />
        <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
        {[1, 2].map((i) => (
          <Skeleton key={i} variant="rounded" height={140} sx={{ borderRadius: 3 }} />
        ))}
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!atividade) return <Alert severity="warning">Atividade não encontrada.</Alert>;

  const isFechada = atividade.status === 'fechado' || (atividade.dataFechamento && new Date(atividade.dataFechamento) < new Date());

  return (
    <Box className="fade-in">
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          underline="hover"
          color="inherit"
          sx={{ cursor: 'pointer', fontSize: '0.875rem' }}
          onClick={() => navigate('/aluno/atividades')}
        >
          Atividades
        </Link>
        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
          {atividade.titulo}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Tooltip title="Voltar">
          <IconButton onClick={() => navigate('/aluno/atividades')}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Box>
          <Typography variant="h5">{atividade.titulo}</Typography>
          {atividade.descricao && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {atividade.descricao}
            </Typography>
          )}
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {isFechada && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Esta atividade está encerrada. O envio de novas submissões está desabilitado, mas você ainda pode visualizar o histórico.
        </Alert>
      )}

      {/* Funções */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Exercícios ({atividade.funcoes?.length || 0})
      </Typography>

      {atividade.funcoes?.length === 0 ? (
        <Alert severity="info" variant="outlined">
          Nenhum exercício disponível nesta atividade.
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {atividade.funcoes?.map((funcao, idx) => {
            const funcProg = progresso.find(p => p.funcaoUuid === funcao.uuid);
            const melhorNota = funcProg?.melhorNota || 0;
            const tentativas = funcProg?.tentativasUsadas || 0;
            
            let statusLabel = '⬜ Pendente';
            let statusColor = 'default';
            if (tentativas > 0) {
              if (melhorNota >= funcao.pontos) {
                statusLabel = '✅ Completo';
                statusColor = 'success';
              } else {
                statusLabel = '⚠️ Parcial';
                statusColor = 'warning';
              }
            }

            return (
            <Card key={funcao.uuid}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
                  <CodeIcon color="primary" />
                  <Typography variant="h6" sx={{ fontFamily: 'monospace', fontSize: '1.05rem' }}>
                    {funcao.nomeFuncao}()
                  </Typography>
                  <Chip label={`${funcao.pontos} pts`} size="small" color="primary" variant="outlined" />
                  {funcao.dificuldade && (
                    <Chip 
                      label={DIFICULDADE_LABELS[funcao.dificuldade] || 'Médio'} 
                      size="small" 
                      color={DIFICULDADE_COLORS[funcao.dificuldade] || 'warning'} 
                    />
                  )}
                  <Box sx={{ flexGrow: 1 }} />
                  <Chip label={statusLabel} size="small" color={statusColor} />
                </Box>
                {funcao.descricao && (
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 5, mb: 1 }}>
                    {funcao.descricao}
                  </Typography>
                )}
                {tentativas > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 5, display: 'block' }}>
                    Melhor nota: {melhorNota.toFixed(2)} / {funcao.pontos} — {tentativas} tentativa(s)
                  </Typography>
                )}
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button
                  variant={isFechada ? "outlined" : "contained"}
                  startIcon={<PlayArrowIcon />}
                  onClick={() => navigate(`/aluno/atividades/${uuid}/funcao/${funcao.uuid}/submeter`)}
                  color={isFechada ? "inherit" : "primary"}
                >
                  {isFechada ? "Visualizar Código" : "Submeter Código"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/aluno/atividades/${uuid}/funcao/${funcao.uuid}/submissoes`)}
                >
                  Minhas Submissões
                </Button>
              </CardActions>
            </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

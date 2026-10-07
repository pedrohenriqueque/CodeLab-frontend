/**
 * StudentActivityDetailPage — Tela de continuar/iniciar atividade do aluno.
 *
 * Implementa com fidelidade visual a interface CodeLab:
 * - Breadcrumbs limpo com retorno para Atividades
 * - Título da atividade com pill badge (Exercício de prática / Prova avaliativa)
 * - Card métrico de resumo em 4 colunas com divisores:
 *   1. Entrega até (data de fechamento)
 *   2. Funções com envio (X de Y funções)
 *   3. Progresso da atividade com barra linear percentual
 *   4. Nota atual calculada (pontos obtidos / pontos totais)
 * - Lista de funções em cards individuais:
 *   * Ícone de código < >
 *   * Nome da função com parênteses nomeFuncao()
 *   * Descrição do enunciado
 *   * Tags de dificuldade (Fácil, Médio, Difícil) e pontuação (X pts)
 *   * Bloco de status alinhado: Concluído (verde), Em andamento (azul), Não iniciada (cinza)
 *   * Detalhes de nota e número de tentativas
 *   * Ações dinâmicas: Ver resultado (outlined), Continuar (contained), Iniciar (outlined) + Chevron
 */

import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  LinearProgress,
  Alert,
  Skeleton,
  Divider,
  Button,
} from '@mui/material';

// Icons
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import FormatListBulletedOutlinedIcon from '@mui/icons-material/FormatListBulletedOutlined';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';

import useAtividadeDetail from '../hooks/useAtividadeDetail';
import useActivityProgress from '../hooks/useActivityProgress';
import { getSubmissoes } from '../../submissoes/api';
import NoVisibleTestCasesNotice from '../../../shared/components/NoVisibleTestCasesNotice';

// ─── Formatters & Helpers ───────────────────────────────────────────────────

function formatDateOnly(iso) {
  if (!iso) return 'Sem prazo';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'Sem prazo';
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return 'Sem prazo';
  }
}

function formatScore(val) {
  if (val == null) return '0';
  const num = Number(val);
  if (Number.isNaN(num)) return '0';
  return Number.isInteger(num) ? num.toString() : num.toFixed(1).replace('.', ',');
}

function deriveFuncaoStatus(prog, funcao, isProva) {
  const pontosMax = Number(funcao.peso ?? funcao.pontos ?? 10);
  const temEnvio = Boolean(prog && (prog.enviada || (prog.tentativasUsadas ?? 0) > 0));
  if (!temEnvio) return 'nao_iniciada';
  if (isProva) return 'enviada';
  const nota = Number(prog.melhorNota ?? 0);
  if (prog.aprovada || (pontosMax > 0 && nota >= pontosMax)) return 'concluida';
  return 'em_andamento';
}

function getDifficultyConfig(dificuldade) {
  const d = (dificuldade || 'facil').toString().toLowerCase();
  if (d.includes('facil') || d.includes('fácil')) {
    return { label: 'Fácil', bg: '#dcfce7', color: '#15803d' };
  }
  if (d.includes('med') || d.includes('méd')) {
    return { label: 'Médio', bg: '#ffedd5', color: '#c2410c' };
  }
  if (d.includes('dif')) {
    return { label: 'Difícil', bg: '#fee2e2', color: '#dc2626' };
  }
  return { label: 'Fácil', bg: '#dcfce7', color: '#15803d' };
}

// ─── Code Bracket Icon ──────────────────────────────────────────────────────

function CodeBracketsIcon() {
  return (
    <Box
      sx={{
        color: '#2563eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.25rem',
        fontWeight: 800,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
        letterSpacing: '-2px',
        lineHeight: 1,
        flexShrink: 0,
        width: 32,
        height: 32,
      }}
    >
      &lt;&gt;
    </Box>
  );
}

// ─── Function Card Component ────────────────────────────────────────────────

function FuncaoItemCard({ funcao, prog, uuid, navigate, isProva }) {
  const targetFuncUuid = funcao.funcaoUuid || funcao.uuid;
  const tentativas = prog?.tentativasUsadas ?? 0;
  const melhorNota = prog?.melhorNota ?? 0;
  const status = deriveFuncaoStatus(prog, funcao, isProva);
  const pontosMax = Number(funcao.peso ?? funcao.pontos ?? 10);
  const diffConfig = getDifficultyConfig(funcao.dificuldade);

  const handleAction = async (e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    if (status === 'concluida' || status === 'enviada') {
      let targetSubUuid = prog?.melhorTentativaUuid || prog?.ultimaTentativaUuid;
      if (!targetSubUuid) {
        try {
          const subs = await getSubmissoes(targetFuncUuid, null, uuid);
          if (Array.isArray(subs) && subs.length > 0) {
            const subsDestaFuncao = subs.filter((s) => {
              const sFunc = s.funcaoUuid || s.funcao_atividade_uuid || s.funcao_uuid;
              const matchFunc = sFunc && String(sFunc).toLowerCase() === String(targetFuncUuid).toLowerCase();
              const matchAtiv = !uuid || !s.atividadeUuid || String(s.atividadeUuid).toLowerCase() === String(uuid).toLowerCase();
              return matchFunc && matchAtiv;
            });
            if (subsDestaFuncao.length > 0) {
              const maxSub = subsDestaFuncao.find(
                (s) => s.nota != null && Number(s.nota) >= pontosMax
              );
              targetSubUuid = (maxSub || subsDestaFuncao[0]).uuid;
            }
          }
        } catch (err) {
          console.error('Erro ao buscar submissões para redirecionamento:', err);
        }
      }
      if (targetSubUuid) {
        navigate(`/aluno/submissoes/${targetSubUuid}`);
        return;
      }
    }
    navigate(`/aluno/atividades/${uuid}/funcao/${targetFuncUuid}/submeter`);
  };

  return (
    <Card
      elevation={0}
      onClick={handleAction}
      sx={{
        cursor: 'pointer',
        mb: 2,
        p: { xs: 2, sm: 2.25, md: '20px 24px' },
        borderRadius: '14px',
        border: '1px solid',
        borderColor: '#e2e8f0',
        backgroundColor: '#ffffff',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
          borderColor: '#cbd5e1',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 2, md: 3 },
        }}
      >
        {/* Lado Esquerdo: Ícone < >, Título, Descrição, Badges */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 1, minWidth: 0 }}>
          <Box sx={{ mt: 0.25 }}>
            <CodeBracketsIcon />
          </Box>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                fontSize: '1rem',
                color: '#0f172a',
                letterSpacing: '-0.01em',
                lineHeight: 1.3,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {funcao.nomeFuncao}()
            </Typography>

            {funcao.descricao && (
              <Typography
                variant="body2"
                sx={{
                  color: '#64748b',
                  fontSize: '0.84rem',
                  lineHeight: 1.45,
                  mt: 0.35,
                  mb: 1.1,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {funcao.descricao}
              </Typography>
            )}

            {/* Badges de Dificuldade e Pontos */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Box
                sx={{
                  bgcolor: diffConfig.bg,
                  color: diffConfig.color,
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  px: 1.25,
                  py: 0.35,
                  lineHeight: 1.2,
                }}
              >
                {diffConfig.label}
              </Box>

              <Box
                sx={{
                  bgcolor: '#eff6ff',
                  color: '#2563eb',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  px: 1.25,
                  py: 0.35,
                  lineHeight: 1.2,
                }}
              >
                {formatScore(pontosMax)} pts
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Lado Central/Direito: Status e Tentativas */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: { xs: 'flex-start', md: 'flex-start' },
            minWidth: { xs: '100%', md: 175 },
            flexShrink: 0,
            gap: 0.5,
          }}
        >
          {status === 'concluida' && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.85 }}>
                <CheckCircleRoundedIcon sx={{ fontSize: 18, color: '#16a34a' }} />
                <Box
                  sx={{
                    bgcolor: '#dcfce7',
                    color: '#15803d',
                    fontWeight: 600,
                    fontSize: '0.72rem',
                    borderRadius: '6px',
                    px: 1,
                    py: 0.25,
                    lineHeight: 1.2,
                  }}
                >
                  Concluído
                </Box>
              </Box>
              <Typography variant="body2" sx={{ fontSize: '0.835rem', color: '#1e293b', mt: 0.25 }}>
                Melhor nota:{' '}
                <Box component="span" sx={{ fontWeight: 700 }}>
                  {formatScore(melhorNota)} / {formatScore(pontosMax)}
                </Box>
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.76rem', color: '#64748b' }}>
                {tentativas} tentativa{tentativas !== 1 ? 's' : ''}
              </Typography>
            </>
          )}

          {status === 'em_andamento' && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.85 }}>
                <AccessTimeRoundedIcon sx={{ fontSize: 18, color: '#2563eb' }} />
                <Box
                  sx={{
                    bgcolor: '#eff6ff',
                    color: '#2563eb',
                    fontWeight: 600,
                    fontSize: '0.72rem',
                    borderRadius: '6px',
                    px: 1,
                    py: 0.25,
                    lineHeight: 1.2,
                  }}
                >
                  Em andamento
                </Box>
              </Box>
              <Typography variant="body2" sx={{ fontSize: '0.835rem', color: '#1e293b', mt: 0.25 }}>
                Nota atual:{' '}
                <Box component="span" sx={{ fontWeight: 700 }}>
                  {formatScore(melhorNota)} / {formatScore(pontosMax)}
                </Box>
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.76rem', color: '#64748b' }}>
                {tentativas} tentativa{tentativas !== 1 ? 's' : ''}
              </Typography>
            </>
          )}

          {status === 'enviada' && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.85 }}>
                <CheckCircleRoundedIcon sx={{ fontSize: 18, color: '#2563eb' }} />
                <Box
                  sx={{
                    bgcolor: '#eff6ff',
                    color: '#2563eb',
                    fontWeight: 600,
                    fontSize: '0.72rem',
                    borderRadius: '6px',
                    px: 1,
                    py: 0.25,
                    lineHeight: 1.2,
                  }}
                >
                  Enviada
                </Box>
              </Box>
              <Typography variant="caption" sx={{ fontSize: '0.76rem', color: '#64748b', mt: 0.5 }}>
                {tentativas} tentativa enviada
              </Typography>
            </>
          )}

          {status === 'nao_iniciada' && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.85 }}>
                <RemoveCircleOutlineRoundedIcon sx={{ fontSize: 18, color: '#94a3b8' }} />
                <Box
                  sx={{
                    bgcolor: '#f1f5f9',
                    color: '#64748b',
                    fontWeight: 600,
                    fontSize: '0.72rem',
                    borderRadius: '6px',
                    px: 1,
                    py: 0.25,
                    lineHeight: 1.2,
                  }}
                >
                  Não iniciada
                </Box>
              </Box>
              <Typography variant="caption" sx={{ fontSize: '0.76rem', color: '#64748b', mt: 0.5 }}>
                Nenhuma tentativa
              </Typography>
            </>
          )}
        </Box>

        {/* Lado Direito: Botão de Ação + Chevron */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            width: { xs: '100%', md: 'auto' },
            justifyContent: { xs: 'flex-end', md: 'flex-start' },
            flexShrink: 0,
          }}
        >
          {status === 'concluida' && (
            <Button
              variant="outlined"
              onClick={handleAction}
              sx={{
                borderColor: '#2563eb',
                borderWidth: '1.5px',
                color: '#2563eb',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                px: 2.75,
                py: 0.8,
                fontSize: '0.85rem',
                fontWeight: 600,
                textTransform: 'none',
                minWidth: 130,
                '&:hover': {
                  borderWidth: '1.5px',
                  borderColor: '#1d4ed8',
                  backgroundColor: '#eff6ff',
                },
              }}
            >
              Ver resultado
            </Button>
          )}

          {status === 'em_andamento' && (
            <Button
              variant="contained"
              onClick={handleAction}
              sx={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                borderRadius: '8px',
                px: 3.25,
                py: 0.8,
                fontSize: '0.85rem',
                fontWeight: 600,
                textTransform: 'none',
                minWidth: 130,
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#1d4ed8',
                  boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
                },
              }}
            >
              Continuar
            </Button>
          )}

          {status === 'enviada' && (
            <Button
              variant="outlined"
              onClick={handleAction}
              sx={{
                borderColor: '#2563eb',
                borderWidth: '1.5px',
                color: '#2563eb',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                px: 2.75,
                py: 0.8,
                fontSize: '0.85rem',
                fontWeight: 600,
                textTransform: 'none',
                minWidth: 130,
                '&:hover': {
                  borderWidth: '1.5px',
                  borderColor: '#1d4ed8',
                  backgroundColor: '#eff6ff',
                },
              }}
            >
              Ver resultado
            </Button>
          )}

          {status === 'nao_iniciada' && (
            <Button
              variant="outlined"
              onClick={handleAction}
              sx={{
                borderColor: '#2563eb',
                borderWidth: '1.5px',
                color: '#2563eb',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                px: 3.25,
                py: 0.8,
                fontSize: '0.85rem',
                fontWeight: 600,
                textTransform: 'none',
                minWidth: 130,
                '&:hover': {
                  borderWidth: '1.5px',
                  borderColor: '#1d4ed8',
                  backgroundColor: '#eff6ff',
                },
              }}
            >
              Iniciar
            </Button>
          )}

          <ChevronRightRoundedIcon
            onClick={handleAction}
            sx={{
              color: '#94a3b8',
              fontSize: 22,
              cursor: 'pointer',
              transition: 'transform 0.15s ease, color 0.15s ease',
              '&:hover': {
                color: '#2563eb',
                transform: 'translateX(2px)',
              },
            }}
          />
        </Box>
      </Box>
    </Card>
  );
}

// ─── Main Page Component ────────────────────────────────────────────────────

export default function StudentActivityDetailPage() {
  const { uuid } = useParams();
  const navigate = useNavigate();

  const { atividade, loading, error } = useAtividadeDetail(uuid);
  const { progresso } = useActivityProgress(uuid);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 1 }}>
        <Skeleton variant="text" width={260} height={24} />
        <Skeleton variant="text" width={380} height={36} />
        <Skeleton variant="rounded" height={105} sx={{ borderRadius: 4 }} />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="rounded" height={88} sx={{ borderRadius: 3 }} />
        ))}
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!atividade) return <Alert severity="warning">Atividade não encontrada.</Alert>;

  const isFechada =
    atividade.status === 'ENCERRADA' ||
    (atividade.dataFechamento && new Date(atividade.dataFechamento) < new Date());
  const isProva = atividade.tipo?.toUpperCase() === 'PROVA';

  const funcoes = atividade.funcoes ?? [];
  const totalPontos = funcoes.reduce((s, f) => s + (f.peso ?? f.pontos ?? 10), 0);

  let pontosObtidos = 0;
  for (const f of funcoes) {
    const targetFuncUuid = f.funcaoUuid || f.uuid;
    const prog = progresso.find(
      (p) => String(p.funcaoUuid || p.funcaoAtividadeUuid || p.funcao_atividade_uuid).toLowerCase() === String(targetFuncUuid).toLowerCase()
    );
    if (!isProva && prog && prog.tentativasUsadas > 0) {
      pontosObtidos += prog.melhorNota ?? 0;
    }
  }

  const funcoesEnviadas = progresso.filter((funcao) => (funcao.tentativasUsadas ?? 0) > 0).length;

  const progressoPct = funcoes.length > 0
    ? Math.round((funcoesEnviadas / funcoes.length) * 100)
    : 0;

  const badgeTipoLabel = isProva ? 'Prova avaliativa' : 'Exercício de prática';

  return (
    <Box className="fade-in" sx={{ pb: 6 }}>
      {/* 1. Breadcrumbs */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography
          onClick={() => navigate('/aluno/atividades')}
          sx={{
            fontSize: '0.84rem',
            color: '#64748b',
            cursor: 'pointer',
            transition: 'color 0.15s ease',
            '&:hover': { color: '#2563eb' },
          }}
        >
          Atividades
        </Typography>
        <ChevronRightRoundedIcon sx={{ fontSize: 15, color: '#94a3b8' }} />
        <Typography sx={{ fontSize: '0.84rem', color: '#475569', fontWeight: 500 }}>
          {atividade.titulo}
        </Typography>
      </Box>

      {/* 2. Page Header: Title + Badge + Subtitle */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, flexWrap: 'wrap', mb: 0.75 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.4rem', sm: '1.65rem' },
              color: '#0f172a',
              letterSpacing: '-0.025em',
            }}
          >
            {atividade.titulo}
          </Typography>

          <Box
            sx={{
              bgcolor: '#eff6ff',
              color: '#2563eb',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '16px',
              px: 1.5,
              py: 0.4,
              letterSpacing: '-0.01em',
            }}
          >
            {badgeTipoLabel}
          </Box>
        </Box>

        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5 }}>
          {atividade.descricao || 'Resolva as funções abaixo no seu ritmo e acompanhe seu progresso.'}
        </Typography>
      </Box>

      {/* Alerta de Atividade Encerrada */}
      {isFechada && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
          Esta atividade está encerrada pelo prazo. O envio de novas submissões está desabilitado, mas você ainda pode visualizar suas soluções.
        </Alert>
      )}

      {/* 3. Metric Summary Banner Card (4 colunas) */}
      <Card
        elevation={0}
        sx={{
          mb: 4,
          p: { xs: 2.25, md: '20px 28px' },
          borderRadius: '16px',
          border: '1px solid',
          borderColor: '#e2e8f0',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'center' },
            justifyContent: 'space-between',
            gap: { xs: 2.5, md: 3 },
          }}
        >
          {/* Coluna 1: Entrega até */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, flex: 1 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '10px',
                bgcolor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CalendarTodayOutlinedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500, lineHeight: 1.2, mb: 0.35 }}>
                Entrega até
              </Typography>
              <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
                {formatDateOnly(atividade.dataFechamento)}
              </Typography>
            </Box>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, borderColor: '#f1f5f9' }} />

          {/* Coluna 2: Funções com envio */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, flex: 1.1 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '10px',
                bgcolor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FormatListBulletedOutlinedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em', lineHeight: 1.25 }}>
                {funcoesEnviadas} de {funcoes.length} funções
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500, mt: 0.25 }}>
                com envio
              </Typography>
            </Box>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, borderColor: '#f1f5f9' }} />

          {/* Coluna 3: Progresso da atividade */}
          <Box sx={{ flex: 1.3 }}>
            <Typography sx={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500, mb: 1 }}>
              Progresso da atividade
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
              <LinearProgress
                variant="determinate"
                value={progressoPct}
                sx={{
                  flex: 1,
                  height: 9,
                  borderRadius: 5,
                  bgcolor: '#e2e8f0',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#2563eb',
                    borderRadius: 5,
                  },
                }}
              />
              <Typography sx={{ fontSize: '0.925rem', fontWeight: 700, color: '#0f172a', minWidth: 38 }}>
                {progressoPct}%
              </Typography>
            </Box>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, borderColor: '#f1f5f9' }} />

          {/* Coluna 4: Nota atual */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, flex: 0.9 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '10px',
                bgcolor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <BarChartRoundedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500, lineHeight: 1.2, mb: 0.35 }}>
                Nota atual
              </Typography>
              <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
                {isProva ? '—' : `${formatScore(pontosObtidos)} / ${formatScore(totalPontos)}`}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Card>

      {/* 4. Section Title */}
      <Box sx={{ mb: 2.5 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            fontSize: '1.18rem',
            color: '#0f172a',
            letterSpacing: '-0.015em',
            mb: 0.35,
          }}
        >
          Funções da atividade
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
          Resolva cada função individualmente. Seu progresso é salvo automaticamente.
        </Typography>
      </Box>

      {/* 5. Functions List */}
      {funcoes.length === 0 ? (
        <Alert severity="info" variant="outlined" sx={{ borderRadius: 3 }}>
          Nenhuma função cadastrada nesta atividade.
        </Alert>
      ) : (
        <Box>
          {funcoes.length > 0 && funcoes.every((funcao) => !(funcao.casosTeste || []).length) && <NoVisibleTestCasesNotice />}
          {funcoes.map((funcao) => {
            const targetFuncUuid = funcao.funcaoUuid || funcao.uuid;
            const prog = progresso.find(
              (p) => String(p.funcaoUuid || p.funcaoAtividadeUuid || p.funcao_atividade_uuid).toLowerCase() === String(targetFuncUuid).toLowerCase()
            );
            return (
              <FuncaoItemCard
                key={targetFuncUuid}
                funcao={funcao}
                prog={prog}
                uuid={uuid}
                navigate={navigate}
                isProva={isProva}
              />
            );
          })}
        </Box>
      )}
    </Box>
  );
}

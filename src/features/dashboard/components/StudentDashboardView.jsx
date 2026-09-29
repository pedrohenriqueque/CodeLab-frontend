/**
 * StudentDashboardView — Início do Aluno (Dashboard Principal).
 *
 * Implementa com alta fidelidade visual o design de referência:
 * - Topo: Saudação personalizada ("Olá, Pedro!") com ilustração interativa de código C e badge "C".
 * - Métricas superiores: 3 cards (Para fazer, Em andamento, Próximo prazo).
 * - Painéis inferiores em 2 colunas:
 *   - "Para fazer": cards com contagem de funções, status "Não iniciada" e botão "Abrir atividade".
 *   - "Em andamento": cards com barra de progresso horizontal, porcentagem, funções concluídas e botão "Continuar atividade".
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Skeleton,
  Alert,
} from '@mui/material';

// Icons
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

// Paleta visual para ícones dos cards
const ICON_PALETTES = [
  { bg: '#F9F5FF', color: '#7F56D9' }, // Roxo
  { bg: '#ECFDF3', color: '#12B76A' }, // Verde
  { bg: '#EFF8FF', color: '#1570EF' }, // Azul
];

function formatDateShort(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

function isActivityClosed(a) {
  if (a.situacao?.toUpperCase() === 'ENCERRADA') return true;
  if (a.status?.toUpperCase() === 'ENCERRADA') return true;
  const fim = a.fimEm || a.fim_em;
  if (fim) {
    const fimDate = new Date(fim);
    if (!isNaN(fimDate.getTime()) && fimDate <= new Date()) {
      return true;
    }
  }
  return false;
}

export default function StudentDashboardView({
  data,
  user,
  loading,
  error,
  onRetry,
}) {
  const navigate = useNavigate();
  const firstName = user?.nome?.trim().split(' ')[0] || 'Estudante';

  // Processamento e categorização das atividades
  const { paraFazer, emAndamento, proximoPrazo } = useMemo(() => {
    const atividades = data?.atividades || [];
    const agora = new Date();

    const todo = [];
    const inProgress = [];

    for (const a of atividades) {
      const isEncerrada = isActivityClosed(a);
      const enviadas = a.funcoesEnviadas ?? a.funcoes_enviadas ?? 0;
      const total = a.totalFuncoes ?? a.total_funcoes ?? 0;

      // Se a atividade já encerrou (seja por status ou prazo vencido),
      // ela NUNCA deve aparecer em "Para fazer" nem em "Em andamento"
      if (isEncerrada) {
        continue;
      }

      if (enviadas === 0) {
        todo.push(a);
      } else if (enviadas < total) {
        inProgress.push(a);
      }
    }

    // Calcula o próximo prazo mais iminente dentre atividades não finalizadas
    const comPrazo = atividades
      .filter((a) => {
        if (isActivityClosed(a)) return false;
        const fim = a.fimEm || a.fim_em;
        if (!fim) return false;
        const d = new Date(fim);
        return !isNaN(d.getTime()) && d > agora;
      })
      .sort(
        (a, b) =>
          new Date(a.fimEm || a.fim_em).getTime() -
          new Date(b.fimEm || b.fim_em).getTime()
      );

    const proxima = comPrazo[0] || null;

    return {
      paraFazer: todo,
      emAndamento: inProgress,
      proximoPrazo: proxima,
    };
  }, [data]);

  return (
    <Box className="fade-in" sx={{ pb: 6 }}>
      {/* ─── Topo / Hero: Saudação + Ilustração Código C ──────────────────── */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 3,
          mb: 4,
        }}
      >
        {/* Título & Subtítulo */}
        <Box sx={{ maxWidth: 600 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.85rem', sm: '2.4rem' },
              color: '#101828',
              letterSpacing: '-0.025em',
              mb: 0.75,
            }}
          >
            Olá, {firstName}!
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '0.95rem', sm: '1.05rem' },
              color: '#475467',
              fontWeight: 400,
              lineHeight: 1.5,
            }}
          >
            Continue seus estudos e acompanhe o que ainda falta concluir.
          </Typography>
        </Box>

        {/* Ilustração Moderna: Janela de Código C com Badge 3D */}
        <Box
          sx={{
            display: { xs: 'none', md: 'block' },
            position: 'relative',
            width: 320,
            height: 130,
            flexShrink: 0,
          }}
        >
          {/* Brilho radial de fundo */}
          <Box
            sx={{
              position: 'absolute',
              top: -15,
              right: 10,
              width: 260,
              height: 140,
              background:
                'radial-gradient(ellipse at center, rgba(56, 189, 248, 0.18), rgba(99, 102, 241, 0.08), transparent 70%)',
              filter: 'blur(20px)',
              zIndex: 0,
            }}
          />

          {/* Brilhos / Estrelas decorativas */}
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              left: 30,
              color: '#38BDF8',
              fontSize: 13,
              opacity: 0.85,
              userSelect: 'none',
            }}
          >
            ✦
          </Box>
          <Box
            sx={{
              position: 'absolute',
              top: 55,
              right: -10,
              color: '#818CF8',
              fontSize: 15,
              opacity: 0.85,
              userSelect: 'none',
            }}
          >
            ✦
          </Box>

          {/* Card de Código com leve inclinação */}
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 18,
              width: 265,
              bgcolor: '#1E293B',
              borderRadius: '12px',
              p: 1.75,
              boxShadow:
                '0 12px 28px -4px rgba(15, 23, 42, 0.22), 0 4px 10px -2px rgba(15, 23, 42, 0.1)',
              fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace",
              fontSize: '0.74rem',
              lineHeight: 1.45,
              color: '#E2E8F0',
              transform: 'rotate(-1.5deg)',
              transition: 'all 0.25s ease',
              zIndex: 1,
              '&:hover': {
                transform: 'rotate(0deg) scale(1.02)',
              },
            }}
          >
            <Box sx={{ color: '#38BDF8' }}>#include &lt;stdio.h&gt;</Box>
            <Box sx={{ color: '#F8FAFC' }}>
              <Box component="span" sx={{ color: '#818CF8' }}>
                int
              </Box>{' '}
              main() &#123;
            </Box>
            <Box sx={{ pl: 2, color: '#F8FAFC' }}>
              printf(
              <Box component="span" sx={{ color: '#34D399' }}>
                "Olá, mundo!\n"
              </Box>
              );
            </Box>
            <Box sx={{ pl: 2, color: '#F8FAFC' }}>
              <Box component="span" sx={{ color: '#F472B6' }}>
                return
              </Box>{' '}
              0;
            </Box>
            <Box sx={{ color: '#F8FAFC' }}>&#125;</Box>
          </Box>

          {/* Badge Azul "C" flutuante */}
          <Box
            sx={{
              position: 'absolute',
              top: -6,
              right: 0,
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: '1.45rem',
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.42)',
              transform: 'rotate(6deg)',
              zIndex: 2,
              userSelect: 'none',
              transition: 'transform 0.25s ease',
              '&:hover': {
                transform: 'rotate(12deg) scale(1.08)',
              },
            }}
          >
            C
          </Box>
        </Box>
      </Box>

      {/* Alerta de Erro com Ação de Recarregar */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: '12px' }}
          action={
            <Button color="inherit" size="small" onClick={onRetry}>
              Tentar novamente
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* ─── Topo: 3 Cards de Indicadores ─────────────────────────────────── */}
      {loading ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            gap: 2.5,
            mb: 4,
          }}
        >
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={110}
              sx={{ borderRadius: '16px' }}
            />
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            gap: 2.5,
            mb: 4,
          }}
        >
          {/* Card 1: Para fazer */}
          <Box
            sx={{
              bgcolor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #EAECF0',
              p: { xs: 2.5, sm: 2.75 },
              boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
              display: 'flex',
              alignItems: 'center',
              gap: 2.25,
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#D0D5DD',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(16, 24, 40, 0.06)',
              },
            }}
          >
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '12px',
                bgcolor: '#FEF3F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F04438',
                flexShrink: 0,
              }}
            >
              <DescriptionOutlinedIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: '#667085',
                  fontWeight: 500,
                  mb: 0.25,
                }}
              >
                Para fazer
              </Typography>
              <Typography
                sx={{
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  color: '#101828',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  mb: 0.25,
                }}
              >
                {paraFazer.length} atividade{paraFazer.length === 1 ? '' : 's'}
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: '#667085' }}>
                Ainda não iniciadas
              </Typography>
            </Box>
          </Box>

          {/* Card 2: Em andamento */}
          <Box
            sx={{
              bgcolor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #EAECF0',
              p: { xs: 2.5, sm: 2.75 },
              boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
              display: 'flex',
              alignItems: 'center',
              gap: 2.25,
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#D0D5DD',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(16, 24, 40, 0.06)',
              },
            }}
          >
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '12px',
                bgcolor: '#EFF8FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1570EF',
                flexShrink: 0,
              }}
            >
              <PlayArrowRoundedIcon sx={{ fontSize: 30 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: '#667085',
                  fontWeight: 500,
                  mb: 0.25,
                }}
              >
                Em andamento
              </Typography>
              <Typography
                sx={{
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  color: '#101828',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  mb: 0.25,
                }}
              >
                {emAndamento.length} atividade{emAndamento.length === 1 ? '' : 's'}
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: '#667085' }}>
                Você já começou
              </Typography>
            </Box>
          </Box>

          {/* Card 3: Próximo prazo */}
          <Box
            sx={{
              bgcolor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #EAECF0',
              p: { xs: 2.5, sm: 2.75 },
              boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
              display: 'flex',
              alignItems: 'center',
              gap: 2.25,
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#D0D5DD',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(16, 24, 40, 0.06)',
              },
            }}
          >
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '12px',
                bgcolor: '#F4EBFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7F56D9',
                flexShrink: 0,
              }}
            >
              <CalendarTodayOutlinedIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: '#667085',
                  fontWeight: 500,
                  mb: 0.25,
                }}
              >
                Próximo prazo
              </Typography>
              <Typography
                sx={{
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  color: '#101828',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  mb: 0.25,
                }}
              >
                {proximoPrazo
                  ? formatDateShort(proximoPrazo.fimEm || proximoPrazo.fim_em)
                  : '—'}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.8rem',
                  color: '#667085',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {proximoPrazo?.titulo || 'Nenhum prazo próximo'}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* ─── Painéis Inferiores em 2 Colunas ────────────────────────────── */}
      {loading ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            gap: 3,
          }}
        >
          <Skeleton
            variant="rounded"
            height={360}
            sx={{ borderRadius: '16px' }}
          />
          <Skeleton
            variant="rounded"
            height={360}
            sx={{ borderRadius: '16px' }}
          />
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            gap: 3,
            alignItems: 'start',
          }}
        >
          {/* ─── Painel Esquerdo: Para fazer ─────────────────────────────── */}
          <Box
            sx={{
              bgcolor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #EAECF0',
              p: { xs: 2.25, sm: 3 },
              boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
            }}
          >
            {/* Cabeçalho do Painel */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 2,
                mb: 2.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '8px',
                    bgcolor: '#FEF3F2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#F04438',
                    flexShrink: 0,
                  }}
                >
                  <DescriptionOutlinedIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: '1.15rem',
                      color: '#101828',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Para fazer
                  </Typography>
                  <Typography sx={{ fontSize: '0.825rem', color: '#667085' }}>
                    Atividades que você ainda não iniciou.
                  </Typography>
                </Box>
              </Box>

              <Box
                onClick={() => navigate('/aluno/atividades')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: '#1570EF',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'color 0.15s ease',
                  '&:hover': { color: '#175CD3' },
                  whiteSpace: 'nowrap',
                }}
              >
                <span>Ver atividades</span>
                <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
              </Box>
            </Box>

            {/* Lista de Cards "Para fazer" */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
              {paraFazer.length === 0 ? (
                <Box
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    bgcolor: '#F8FAFC',
                    borderRadius: '12px',
                    color: '#667085',
                  }}
                >
                  <Typography sx={{ fontSize: '0.875rem' }}>
                    Nenhuma atividade pendente para iniciar.
                  </Typography>
                </Box>
              ) : (
                paraFazer.slice(0, 5).map((atv, idx) => {
                  const palette = ICON_PALETTES[idx % ICON_PALETTES.length];
                  const total = atv.totalFuncoes ?? atv.total_funcoes ?? 0;
                  const isProva = atv.tipo?.toUpperCase() === 'PROVA';
                  const subtitle = isProva
                    ? 'Trabalho avaliativo'
                    : 'Exercício de prática';

                  return (
                    <Box
                      key={atv.uuid}
                      sx={{
                        bgcolor: '#FFFFFF',
                        border: '1px solid #EAECF0',
                        borderRadius: '14px',
                        p: { xs: 2, sm: 2.25 },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        transition: 'all 0.18s ease',
                        boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)',
                        '&:hover': {
                          borderColor: '#B2CCFF',
                          boxShadow: '0 4px 12px rgba(16, 24, 40, 0.05)',
                        },
                      }}
                    >
                      {/* Lado Esquerdo: Ícone + Título + Tipo + Badge de Funções */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.75,
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '10px',
                            bgcolor: palette.bg,
                            color: palette.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <DescriptionOutlinedIcon sx={{ fontSize: 24 }} />
                        </Box>

                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              color: '#101828',
                              lineHeight: 1.3,
                              mb: 0.35,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {atv.titulo}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: '0.8rem',
                              color: '#667085',
                              mb: 0.75,
                            }}
                          >
                            {subtitle}
                          </Typography>

                          {/* Badge de funções */}
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.6,
                              bgcolor: '#F2F4F7',
                              color: '#344054',
                              px: 1,
                              py: 0.3,
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                            }}
                          >
                            <FormatListBulletedRoundedIcon
                              sx={{ fontSize: 13, color: '#667085' }}
                            />
                            <span>{total} funções</span>
                          </Box>
                        </Box>
                      </Box>

                      {/* Lado Direito: Status Pill + Botão Abrir */}
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: 1.5,
                          flexShrink: 0,
                        }}
                      >
                        {/* Pill Não iniciada */}
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.75,
                            px: 1.25,
                            py: 0.35,
                            borderRadius: '999px',
                            bgcolor: '#FEF3F2',
                            color: '#D92D20',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                          }}
                        >
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              border: '1.5px solid #F04438',
                            }}
                          />
                          <span>Não iniciada</span>
                        </Box>

                        {/* Botão Abrir atividade */}
                        <Button
                          variant="contained"
                          onClick={() => navigate(`/aluno/atividades/${atv.uuid}`)}
                          sx={{
                            bgcolor: '#1570EF',
                            color: '#FFFFFF',
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '0.825rem',
                            px: 2,
                            py: 0.65,
                            boxShadow: 'none',
                            whiteSpace: 'nowrap',
                            '&:hover': {
                              bgcolor: '#175CD3',
                              boxShadow: 'none',
                            },
                          }}
                        >
                          Abrir atividade
                        </Button>
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>

          {/* ─── Painel Direito: Em andamento ────────────────────────────── */}
          <Box
            sx={{
              bgcolor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #EAECF0',
              p: { xs: 2.25, sm: 3 },
              boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
            }}
          >
            {/* Cabeçalho do Painel */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 2,
                mb: 2.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '8px',
                    bgcolor: '#EFF8FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1570EF',
                    flexShrink: 0,
                  }}
                >
                  <PlayArrowRoundedIcon sx={{ fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: '1.15rem',
                      color: '#101828',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Em andamento
                  </Typography>
                  <Typography sx={{ fontSize: '0.825rem', color: '#667085' }}>
                    Atividades que você já começou.
                  </Typography>
                </Box>
              </Box>

              <Box
                onClick={() => navigate('/aluno/atividades')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: '#1570EF',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'color 0.15s ease',
                  '&:hover': { color: '#175CD3' },
                  whiteSpace: 'nowrap',
                }}
              >
                <span>Ver atividades</span>
                <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
              </Box>
            </Box>

            {/* Lista de Cards "Em andamento" */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
              {emAndamento.length === 0 ? (
                <Box
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    bgcolor: '#F8FAFC',
                    borderRadius: '12px',
                    color: '#667085',
                  }}
                >
                  <Typography sx={{ fontSize: '0.875rem' }}>
                    Você não possui atividades em andamento no momento.
                  </Typography>
                </Box>
              ) : (
                emAndamento.slice(0, 5).map((atv, idx) => {
                  const palette =
                    idx % 2 === 0
                      ? { bg: '#EFF8FF', color: '#1570EF' }
                      : { bg: '#ECFDF3', color: '#12B76A' };
                  const enviadas = atv.funcoesEnviadas ?? atv.funcoes_enviadas ?? 0;
                  const total = atv.totalFuncoes ?? atv.total_funcoes ?? 0;
                  const pct = total > 0 ? Math.round((enviadas / total) * 100) : 0;

                  return (
                    <Box
                      key={atv.uuid}
                      sx={{
                        bgcolor: '#FFFFFF',
                        border: '1px solid #EAECF0',
                        borderRadius: '14px',
                        p: { xs: 2, sm: 2.25 },
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.75,
                        transition: 'all 0.18s ease',
                        boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)',
                        '&:hover': {
                          borderColor: '#B2CCFF',
                          boxShadow: '0 4px 12px rgba(16, 24, 40, 0.05)',
                        },
                      }}
                    >
                      {/* Linha Superior: Ícone + Título + Status Pill */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1.5,
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: '10px',
                              bgcolor: palette.bg,
                              color: palette.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <DescriptionOutlinedIcon sx={{ fontSize: 24 }} />
                          </Box>

                          <Typography
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              color: '#101828',
                              lineHeight: 1.3,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {atv.titulo}
                          </Typography>
                        </Box>

                        {/* Pill Em andamento */}
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.75,
                            px: 1.25,
                            py: 0.35,
                            borderRadius: '999px',
                            bgcolor: '#EFF8FF',
                            color: '#175CD3',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              border: '1.5px solid #2E90FA',
                            }}
                          />
                          <span>Em andamento</span>
                        </Box>
                      </Box>

                      {/* Linha Central: Barra de Progresso + % + Contador */}
                      <Box>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.75,
                          }}
                        >
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            sx={{
                              flex: 1,
                              height: 6,
                              borderRadius: 3,
                              bgcolor: '#EAECF0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: '#1570EF',
                                borderRadius: 3,
                              },
                            }}
                          />
                          <Typography
                            sx={{
                              fontSize: '0.825rem',
                              fontWeight: 600,
                              color: '#475467',
                              minWidth: 32,
                              textAlign: 'right',
                            }}
                          >
                            {pct}%
                          </Typography>
                        </Box>

                        <Typography
                          sx={{
                            fontSize: '0.78rem',
                            color: '#475467',
                            mt: 0.75,
                          }}
                        >
                          {enviadas} de {total} funções concluídas
                        </Typography>
                      </Box>

                      {/* Linha Inferior: Botão Continuar Atividade */}
                      <Button
                        fullWidth
                        onClick={() => navigate(`/aluno/atividades/${atv.uuid}`)}
                        sx={{
                          bgcolor: '#E0EAFF',
                          color: '#175CD3',
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          py: 1,
                          boxShadow: 'none',
                          '&:hover': {
                            bgcolor: '#D1E9FF',
                            boxShadow: 'none',
                          },
                        }}
                      >
                        Continuar atividade
                      </Button>
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

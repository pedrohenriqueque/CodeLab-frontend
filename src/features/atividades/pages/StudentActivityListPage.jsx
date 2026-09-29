/**
 * StudentActivityListPage — Lista principal de atividades do aluno.
 *
 * Exibe as atividades do aluno agrupadas em seções visuais de alta fidelidade:
 * - "Em andamento": Atividades que o aluno já iniciou (com progresso e nota/status).
 * - "Para fazer": Atividades disponíveis que o aluno ainda não iniciou.
 * - Link inferior para "Ver atividades concluídas" (histórico).
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  InputAdornment,
  TextField,
  Button,
  LinearProgress,
  Skeleton,
  Alert,
} from '@mui/material';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';

import useAtividades from '../hooks/useAtividades';
import { getProgressoAtividade } from '../api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatPeriodo(inicio, fim) {
  const fInicio = formatDate(inicio);
  const fFim = formatDate(fim);
  if (!fInicio && !fFim) return '—';
  if (fInicio && !fFim) return `A partir de ${fInicio}`;
  if (!fInicio && fFim) return `Até ${fFim}`;
  return `${fInicio} — ${fFim}`;
}

function formatGrade(val) {
  const num = Number(val || 0);
  return num.toFixed(1).replace('.', ',');
}

const STATUS_CONFIG = {
  em_andamento: {
    label: 'Em andamento',
    bgcolor: '#EFF8FF',
    color: '#175CD3',
  },
  nao_iniciado: {
    label: 'Não iniciada',
    bgcolor: '#F2F4F7',
    color: '#344054',
  },
  concluido: {
    label: 'Concluído',
    bgcolor: '#ECFDF3',
    color: '#027A48',
  },
};

function isActivityClosed(atv) {
  if (atv.situacao?.toUpperCase() === 'ENCERRADA') return true;
  if (atv.status?.toUpperCase() === 'ENCERRADA') return true;
  const fim = atv.dataFechamento || atv.fimEm || atv.fim_em;
  if (fim) {
    const fimDate = new Date(fim);
    if (!isNaN(fimDate.getTime()) && fimDate <= new Date()) {
      return true;
    }
  }
  return false;
}

function deriveStudentStats(atv, progresso) {
  const isProva = atv.tipo?.toUpperCase() === 'PROVA';
  const isEncerrada = isActivityClosed(atv);
  const funcoes = atv.funcoes || [];
  const total = funcoes.length;

  let pontosObtidos = 0;
  let totalPontos = 0;
  let funcoesEnviadas = 0;
  let funcoesConcluidas = 0;

  for (const f of funcoes) {
    const fUuid = f.funcaoUuid || f.uuid;
    const prog = progresso.find(
      (p) => p.funcaoUuid === fUuid || p.funcaoAtividadeUuid === fUuid
    );
    const peso = Number(f.peso ?? f.pontos ?? 10);
    totalPontos += peso;

    if (prog && (prog.tentativasUsadas > 0 || prog.enviada)) {
      funcoesEnviadas++;
      const nota = Number(prog.melhorNota ?? 0);
      if (!isProva || isEncerrada) {
        pontosObtidos += nota;
      }
      if (nota >= peso) {
        funcoesConcluidas++;
      }
    }
  }

  if (totalPontos === 0) {
    totalPontos = total > 0 ? total * 10 : 10.0;
  }

  // Define o status do aluno na atividade
  let studentStatus;
  if (isEncerrada) {
    studentStatus = funcoesEnviadas > 0 ? 'concluido' : 'encerrada';
  } else if (funcoesEnviadas === 0) {
    studentStatus = 'nao_iniciado';
  } else if (isProva) {
    studentStatus = funcoesEnviadas === total && total > 0 ? 'concluido' : 'em_andamento';
  } else {
    studentStatus = funcoesConcluidas === total && total > 0 ? 'concluido' : 'em_andamento';
  }

  // Progresso em porcentagem
  const progressoPct = total > 0 ? (funcoesEnviadas / total) * 100 : 0;

  // Texto descritivo de progresso
  let progressLabel;
  if (isProva) {
    if (funcoesEnviadas === total && total > 0) {
      progressLabel = `${funcoesEnviadas} de ${total} enviadas`;
    } else {
      progressLabel = `${funcoesEnviadas} de ${total} funções enviadas`;
    }
  } else {
    if (funcoesEnviadas > 0) {
      progressLabel = `${funcoesEnviadas} de ${total} funções enviadas`;
    } else {
      progressLabel = `0 de ${total} funções concluídas`;
    }
  }

  return {
    isProva,
    isEncerrada,
    total,
    totalPontos,
    pontosObtidos,
    funcoesEnviadas,
    funcoesConcluidas,
    studentStatus,
    progressoPct,
    progressLabel,
  };
}

// ─── Componente Card de Atividade ───────────────────────────────────────────

function StudentActivityCard({ atv, progresso, onNavigate, sectionType }) {
  const {
    isProva,
    isEncerrada,
    totalPontos,
    pontosObtidos,
    studentStatus,
    progressoPct,
    progressLabel,
  } = useMemo(() => deriveStudentStats(atv, progresso), [atv, progresso]);

  const statusCfg = STATUS_CONFIG[studentStatus] || STATUS_CONFIG.nao_iniciado;
  const isStarted = sectionType === 'em_andamento' || studentStatus !== 'nao_iniciado';
  const actionLabel = isStarted ? 'Continuar' : 'Iniciar atividade';

  return (
    <Box
      onClick={() => onNavigate(`/aluno/atividades/${atv.uuid}`)}
      sx={{
        bgcolor: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #E4E7EC',
        p: { xs: 2, sm: 2.25 },
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'center' },
        justifyContent: 'space-between',
        gap: { xs: 2, md: 3 },
        cursor: 'pointer',
        transition: 'all 0.18s ease-in-out',
        boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
        '&:hover': {
          borderColor: '#B2CCFF',
          boxShadow: '0 4px 14px rgba(16, 24, 40, 0.06)',
          transform: 'translateY(-1px)',
        },
      }}
    >
      {/* Coluna 1: Ícone + Título, Descrição e Período */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flex: '1 1 280px',
          minWidth: 0,
        }}
      >
        {/* Caixa quadrada de ícone */}
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            bgcolor: isProva ? '#F9F5FF' : '#EFF8FF',
            color: isProva ? '#7F56D9' : '#1570EF',
          }}
        >
          {isProva ? (
            <DescriptionOutlinedIcon sx={{ fontSize: 24 }} />
          ) : (
            <CodeRoundedIcon sx={{ fontSize: 24 }} />
          )}
        </Box>

        {/* Informações textuais */}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: '0.975rem',
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

          {atv.descricao && (
            <Typography
              sx={{
                fontSize: '0.815rem',
                color: '#475467',
                lineHeight: 1.4,
                mb: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {atv.descricao}
            </Typography>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <CalendarTodayOutlinedIcon sx={{ fontSize: 13, color: '#98A2B3' }} />
            <Typography sx={{ fontSize: '0.75rem', color: '#667085', fontWeight: 500 }}>
              {formatPeriodo(atv.dataAbertura, atv.dataFechamento)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Coluna 2: Tipo de Atividade + Contador + Barra de Progresso */}
      <Box sx={{ width: { xs: '100%', md: 210 }, flexShrink: 0 }}>
        {/* Tag do Tipo */}
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            px: 1.1,
            py: 0.25,
            borderRadius: '6px',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            bgcolor: isProva ? '#F4EBFF' : '#E0F2FE',
            color: isProva ? '#6941C6' : '#026AA2',
          }}
        >
          {isProva ? 'Prova avaliativa' : 'Exercício de prática'}
        </Box>

        {/* Texto do Progresso */}
        <Typography
          sx={{
            fontSize: '0.78rem',
            fontWeight: 500,
            color: '#344054',
            mt: 0.6,
            mb: 0.45,
          }}
        >
          {progressLabel}
        </Typography>

        {/* Barra de Progresso */}
        <LinearProgress
          variant="determinate"
          value={progressoPct}
          sx={{
            height: 5,
            borderRadius: 3,
            bgcolor: '#EAECF0',
            '& .MuiLinearProgress-bar': {
              bgcolor: '#1570EF',
              borderRadius: 3,
            },
          }}
        />
      </Box>

      {/* Coluna 3: Chip de Status + Nota Atual ou Aviso de Ocultação */}
      <Box
        sx={{
          width: { xs: '100%', md: 190 },
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}
      >
        {/* Status Chip */}
        <Box
          sx={{
            display: 'inline-block',
            px: 1.2,
            py: 0.25,
            borderRadius: '6px',
            fontSize: '0.72rem',
            fontWeight: 700,
            bgcolor: statusCfg.bgcolor,
            color: statusCfg.color,
          }}
        >
          {statusCfg.label}
        </Box>

        {/* Linha de Nota / Resultados */}
        <Box sx={{ mt: 0.75, minHeight: 20, display: 'flex', alignItems: 'center' }}>
          {isProva && !isEncerrada ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <InfoOutlinedIcon sx={{ fontSize: 14, color: '#667085' }} />
              <Typography sx={{ fontSize: '0.75rem', color: '#667085', fontWeight: 500 }}>
                Resultados ocultos até o encerramento.
              </Typography>
            </Box>
          ) : (
            <Typography sx={{ fontSize: '0.8rem', color: '#667085' }}>
              Nota atual:{' '}
              <Box
                component="span"
                sx={{ fontWeight: 800, color: '#101828', fontSize: '0.875rem' }}
              >
                {formatGrade(pontosObtidos)} / {formatGrade(totalPontos)}
              </Box>
            </Typography>
          )}
        </Box>
      </Box>

      {/* Coluna 4: Botão de Ação */}
      <Box
        sx={{
          width: { xs: '100%', md: 140 },
          flexShrink: 0,
          display: 'flex',
          justifyContent: { xs: 'stretch', md: 'flex-end' },
        }}
      >
        {isProva ? (
          <Button
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(`/aluno/atividades/${atv.uuid}`);
            }}
            endIcon={<ChevronRightRoundedIcon sx={{ fontSize: 18 }} />}
            sx={{
              borderColor: '#1570EF',
              borderWidth: '1.5px',
              color: '#1570EF',
              bgcolor: '#FFFFFF',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.825rem',
              px: 2,
              py: 0.7,
              width: { xs: '100%', md: 'auto' },
              '&:hover': {
                bgcolor: '#EFF8FF',
                borderColor: '#175CD3',
                borderWidth: '1.5px',
              },
            }}
          >
            {actionLabel}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(`/aluno/atividades/${atv.uuid}`);
            }}
            endIcon={<ChevronRightRoundedIcon sx={{ fontSize: 18 }} />}
            sx={{
              bgcolor: '#1570EF',
              color: '#FFFFFF',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.825rem',
              px: 2,
              py: 0.7,
              boxShadow: 'none',
              width: { xs: '100%', md: 'auto' },
              '&:hover': {
                bgcolor: '#175CD3',
                boxShadow: 'none',
              },
            }}
          >
            {actionLabel}
          </Button>
        )}
      </Box>
    </Box>
  );
}

// ─── Componente de Seção (Em andamento / Para fazer) ──────────────────────────

function ActivitySection({
  title,
  subtitle,
  count,
  type = 'in_progress', // 'in_progress' | 'to_do'
  children,
}) {
  const isProgress = type === 'in_progress';

  return (
    <Box
      sx={{
        bgcolor: '#F8FAFC',
        borderRadius: '16px',
        border: '1px solid #EAECF0',
        p: { xs: 2, sm: 2.75 },
        mb: 3,
      }}
    >
      {/* Cabeçalho da Seção */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, mb: 2.25 }}>
        {/* Ícone Redondo */}
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            bgcolor: isProgress ? '#1570EF' : '#475467',
            color: '#FFFFFF',
            boxShadow: isProgress
              ? '0 2px 6px rgba(21, 112, 239, 0.25)'
              : '0 2px 6px rgba(71, 84, 103, 0.2)',
          }}
        >
          {isProgress ? (
            <PlayArrowRoundedIcon sx={{ fontSize: 24, ml: '2px' }} />
          ) : (
            <AccessTimeRoundedIcon sx={{ fontSize: 22 }} />
          )}
        </Box>

        {/* Título + Contador + Subtítulo */}
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: '1.15rem',
                color: '#101828',
                letterSpacing: '-0.01em',
              }}
            >
              {title}
            </Typography>
            <Box
              sx={{
                bgcolor: isProgress ? '#E0EAFF' : '#E4E7EC',
                color: isProgress ? '#175CD3' : '#344054',
                px: 1,
                py: 0.15,
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                minWidth: 20,
                textAlign: 'center',
                lineHeight: 1.4,
              }}
            >
              {count}
            </Box>
          </Box>
          <Typography sx={{ fontSize: '0.85rem', color: '#475467', mt: 0.25 }}>
            {subtitle}
          </Typography>
        </Box>
      </Box>

      {/* Lista de Atividades */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {children}
      </Box>
    </Box>
  );
}

// ─── Página Principal ────────────────────────────────────────────────────────

export default function StudentActivityListPage() {
  const { atividades, loading, error } = useAtividades();
  const [progresso, setProgresso] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    async function loadProgress() {
      const resultados = await Promise.all(
        atividades.map(async (atividade) => {
          try {
            const funcoes = await getProgressoAtividade(atividade.uuid);
            return funcoes.map((funcao) => ({
              ...funcao,
              atividadeUuid: atividade.uuid,
              funcaoUuid: funcao.funcaoAtividadeUuid,
              tentativasUsadas: funcao.enviada ? 1 : 0,
              melhorNota:
                funcao.melhorNota == null ? 0 : Number(funcao.melhorNota),
            }));
          } catch {
            return [];
          }
        })
      );
      if (active) setProgresso(resultados.flat());
    }
    if (atividades.length > 0) {
      loadProgress();
    }
    return () => {
      active = false;
    };
  }, [atividades]);

  // Agrupa as atividades em "Em andamento" e "Para fazer"
  const { emAndamento, paraFazer } = useMemo(() => {
    const list = atividades.filter((a) => a.status !== 'rascunho');

    // Filtro de busca por texto
    const q = search.trim().toLowerCase();
    const filteredList = q
      ? list.filter(
          (a) =>
            a.titulo?.toLowerCase().includes(q) ||
            a.descricao?.toLowerCase().includes(q)
        )
      : list;

    const inProgressList = [];
    const toDoList = [];

    for (const atv of filteredList) {
      const stats = deriveStudentStats(atv, progresso);
      if (stats.studentStatus === 'em_andamento') {
        inProgressList.push(atv);
      } else if (stats.studentStatus === 'nao_iniciado') {
        toDoList.push(atv);
      }
      // Atividades concluídas podem ser visualizadas na página de histórico
    }

    return {
      emAndamento: inProgressList,
      paraFazer: toDoList,
    };
  }, [atividades, progresso, search]);

  return (
    <Box className="fade-in" sx={{ pb: 6 }}>
      {/* Top Header + Search Bar */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          mb: 3.5,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: '#101828',
              letterSpacing: '-0.02em',
              mb: 0.5,
            }}
          >
            Atividades
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: '#475467', fontSize: '0.925rem' }}
          >
            Veja o que falta fazer e o que você já começou.
          </Typography>
        </Box>

        {/* Input de busca */}
        <TextField
          size="small"
          placeholder="Buscar atividades..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            width: { xs: '100%', sm: 280 },
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              bgcolor: '#FFFFFF',
              fontSize: '0.875rem',
              '& fieldset': {
                borderColor: '#E4E7EC',
              },
              '&:hover fieldset': {
                borderColor: '#CBD5E1',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#1570EF',
              },
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: '#98A2B3' }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '10px' }}>
          {error}
        </Alert>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {[1, 2].map((sec) => (
            <Box
              key={sec}
              sx={{
                bgcolor: '#F8FAFC',
                borderRadius: '16px',
                border: '1px solid #EAECF0',
                p: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width={140} height={26} />
                  <Skeleton variant="text" width={260} height={18} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[1, 2].map((card) => (
                  <Skeleton
                    key={card}
                    variant="rounded"
                    height={86}
                    sx={{ borderRadius: '14px' }}
                  />
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <>
          {/* Seção 1: Em andamento */}
          {emAndamento.length > 0 && (
            <ActivitySection
              title="Em andamento"
              subtitle="Continue de onde parou. Essas são as atividades que você já começou."
              count={emAndamento.length}
              type="in_progress"
            >
              {emAndamento.map((atv) => (
                <StudentActivityCard
                  key={atv.uuid}
                  atv={atv}
                  progresso={progresso}
                  onNavigate={navigate}
                  sectionType="em_andamento"
                />
              ))}
            </ActivitySection>
          )}

          {/* Seção 2: Para fazer */}
          {paraFazer.length > 0 && (
            <ActivitySection
              title="Para fazer"
              subtitle="Estas são as atividades que você ainda não iniciou."
              count={paraFazer.length}
              type="to_do"
            >
              {paraFazer.map((atv) => (
                <StudentActivityCard
                  key={atv.uuid}
                  atv={atv}
                  progresso={progresso}
                  onNavigate={navigate}
                  sectionType="para_fazer"
                />
              ))}
            </ActivitySection>
          )}

          {/* Estado Vazio (quando não houver nenhuma atividade em ambas as seções) */}
          {emAndamento.length === 0 && paraFazer.length === 0 && (
            <Alert
              severity="info"
              variant="outlined"
              sx={{
                borderRadius: '12px',
                p: 2.5,
                bgcolor: '#F8FAFC',
                borderColor: '#E2E8F0',
                mb: 3,
              }}
            >
              {search
                ? 'Nenhuma atividade encontrada para sua busca.'
                : 'Você não possui atividades em andamento ou para fazer no momento.'}
            </Alert>
          )}

          {/* Rodapé: Ver atividades concluídas */}
          <Box
            onClick={() => navigate('/aluno/historico')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 1.5,
              py: 1.75,
              mt: 1,
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
              '&:hover': {
                bgcolor: '#F8FAFC',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CheckCircleOutlineRoundedIcon
                sx={{ fontSize: 22, color: '#475467' }}
              />
              <Box>
                <Typography
                  sx={{
                    color: '#1570EF',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    lineHeight: 1.3,
                  }}
                >
                  Ver atividades concluídas
                </Typography>
                <Typography
                  sx={{ color: '#475467', fontSize: '0.78rem', lineHeight: 1.3 }}
                >
                  Veja as atividades que você já finalizou.
                </Typography>
              </Box>
            </Box>

            <ChevronRightRoundedIcon sx={{ fontSize: 20, color: '#98A2B3' }} />
          </Box>
        </>
      )}
    </Box>
  );
}

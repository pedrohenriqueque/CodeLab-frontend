/**
 * StudentHistoryPage — Histórico de Atividades e Submissões do Aluno.
 *
 * Implementa com alta fidelidade visual o design da referência:
 * - Cabeçalho: Título "Histórico" e subtítulo descritivo.
 * - Barra de pesquisa com filtro de ordenação ("Último envio ↓").
 * - Acordeão de Atividades com cards brancos contendo:
 *   - Ícone colorido por paleta, título, turma e tipo.
 *   - Último envio, nota atual / nota final, funções com envio e chip de status (Aberta / Encerrada).
 *   - Tabela de funções com Chevron, tentativas, melhor nota, último envio.
 *   - Subtabela expansível de tentativas por função com:
 *     - Número (#3, #2, #1) + badge "Melhor" na tentativa de maior nota.
 *     - Chip de resultado (Aprovada, Parcial, Erro de compilação, etc.).
 *     - Nota, data/hora e link direto "Ver detalhes →".
 * - NOTA: Conforme solicitado, o botão redundante "Ocultar tentativas" / "Ver tentativas" foi removido;
 *   o clique na própria linha da função (ou no chevron) expande e recolhe suas tentativas de forma fluida.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Skeleton,
  Alert,
  IconButton,
  Collapse,
  Menu,
  MenuItem,
  Button,
} from '@mui/material';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import SouthRoundedIcon from '@mui/icons-material/SouthRounded';

import { getSubmissoes } from '../../submissoes/api';
import { getAtividades } from '../api';
import { useTurmaContext } from '../../turmas/context/TurmaContext';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';

// Paleta harmônica para os ícones dos cards
const ACTIVITY_PALETTES = [
  { bg: '#EFF8FF', color: '#1570EF', icon: DescriptionOutlinedIcon }, // Azul (doc)
  { bg: '#F9F5FF', color: '#7F56D9', icon: CalculateOutlinedIcon },   // Roxo (math)
  { bg: '#ECFDF3', color: '#12B76A', icon: StorageOutlinedIcon },     // Verde (database)
];

// ─── Formatadores ────────────────────────────────────────────────────────────

function formatDateTimeFull(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '—';
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}/${ano}, ${hora}:${min}`;
}

function formatDateTimeShort(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '—';
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}, ${hora}:${min}`;
}

function formatGrade(val) {
  const num = Number(val || 0);
  return num.toFixed(1).replace('.', ',');
}

function parseIsoDate(val) {
  if (!val) return null;
  const str = String(val).trim().replace(' ', 'T');
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function isActivityClosed(atv) {
  if (!atv) return false;
  if (atv.situacao?.toUpperCase() === 'ENCERRADA') return true;
  if (atv.status?.toUpperCase() === 'ENCERRADA') return true;
  const rawFim = atv.dataFechamento || atv.fimEm || atv.fim_em || atv.data_fechamento;
  if (rawFim) {
    const fimDate = parseIsoDate(rawFim);
    if (fimDate && fimDate.getTime() <= Date.now()) {
      return true;
    }
  }
  return false;
}

// ─── Componente Chip de Resultado ────────────────────────────────────────────

function SubmissionResultChip({ status, nota, peso, isProva, isEncerrada }) {
  // Em provas em andamento, oculta o resultado avaliativo detalhado
  if (isProva && !isEncerrada) {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.25,
          py: 0.35,
          borderRadius: '999px',
          bgcolor: '#F1F5F9',
          color: '#475569',
          fontSize: '0.75rem',
          fontWeight: 600,
        }}
      >
        <AccessTimeRoundedIcon sx={{ fontSize: 14, color: '#64748B' }} />
        <span>Envio registrado</span>
      </Box>
    );
  }

  const normStatus = (status || '').toUpperCase();

  if (normStatus === 'ERRO_COMPILACAO') {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.25,
          py: 0.35,
          borderRadius: '999px',
          bgcolor: '#FEF3F2',
          color: '#B42318',
          fontSize: '0.75rem',
          fontWeight: 600,
        }}
      >
        <CancelRoundedIcon sx={{ fontSize: 14, color: '#F04438' }} />
        <span>Erro de compilação</span>
      </Box>
    );
  }

  if (normStatus === 'FALHA_TECNICA') {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.25,
          py: 0.35,
          borderRadius: '999px',
          bgcolor: '#FFFBEB',
          color: '#B45309',
          fontSize: '0.75rem',
          fontWeight: 600,
        }}
      >
        <WarningAmberRoundedIcon sx={{ fontSize: 14, color: '#F59E0B' }} />
        <span>Falha técnica</span>
      </Box>
    );
  }

  if (normStatus === 'ENVIO_REGISTRADO' || normStatus === 'PENDENTE' || normStatus === 'EXECUTANDO') {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.25,
          py: 0.35,
          borderRadius: '999px',
          bgcolor: '#F1F5F9',
          color: '#475569',
          fontSize: '0.75rem',
          fontWeight: 600,
        }}
      >
        <InfoOutlinedIcon sx={{ fontSize: 14, color: '#64748B' }} />
        <span>Envio registrado</span>
      </Box>
    );
  }

  // Avaliada: Aprovada se nota >= peso, Parcial se > 0, Reprovada se 0
  const notaNum = Number(nota || 0);
  const pesoNum = Number(peso || 10);
  const isAprovada = nota != null && peso != null && notaNum >= pesoNum;

  if (isAprovada) {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.25,
          py: 0.35,
          borderRadius: '999px',
          bgcolor: '#ECFDF3',
          color: '#027A48',
          fontSize: '0.75rem',
          fontWeight: 600,
        }}
      >
        <CheckCircleRoundedIcon sx={{ fontSize: 14, color: '#12B76A' }} />
        <span>Aprovada</span>
      </Box>
    );
  }

  if (notaNum > 0) {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.25,
          py: 0.35,
          borderRadius: '999px',
          bgcolor: '#FEF0C7',
          color: '#B54708',
          fontSize: '0.75rem',
          fontWeight: 600,
        }}
      >
        <AccessTimeRoundedIcon sx={{ fontSize: 14, color: '#F79009' }} />
        <span>Parcial</span>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.25,
        py: 0.35,
        borderRadius: '999px',
        bgcolor: '#FEF3F2',
        color: '#B42318',
        fontSize: '0.75rem',
        fontWeight: 600,
      }}
    >
      <CancelRoundedIcon sx={{ fontSize: 14, color: '#F04438' }} />
      <span>Reprovada</span>
    </Box>
  );
}

// ─── Linha de Função Expansível ──────────────────────────────────────────────

function FunctionAccordionRow({
  fnData,
  isProva,
  isEncerrada,
  onNavigateSubmission,
  isExpandedDefault = false,
}) {
  const [isExpanded, setIsExpanded] = useState(isExpandedDefault);
  const hasAttempts = fnData.tentativasCount > 0;
  const hideGrade = isProva && !isEncerrada;

  const toggleExpand = () => {
    if (hasAttempts) {
      setIsExpanded((prev) => !prev);
    }
  };

  return (
    <>
      {/* Linha Principal da Função */}
      <TableRow
        onClick={toggleExpand}
        sx={{
          cursor: hasAttempts ? 'pointer' : 'default',
          transition: 'background-color 0.15s ease',
          bgcolor: isExpanded ? '#F8FAFC' : 'transparent',
          '&:hover': {
            bgcolor: hasAttempts ? '#F8FAFC' : 'transparent',
          },
          '& td': {
            borderBottom: isExpanded ? 'none' : '1px solid #EAECF0',
            py: 1.75,
            px: 2.5,
          },
        }}
      >
        {/* Coluna 1: Chevron + Nome da Função */}
        <TableCell sx={{ minWidth: 220 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            {hasAttempts ? (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand();
                }}
                sx={{ p: 0.25, color: '#667085' }}
              >
                {isExpanded ? (
                  <KeyboardArrowDownRoundedIcon sx={{ fontSize: 20 }} />
                ) : (
                  <KeyboardArrowRightRoundedIcon sx={{ fontSize: 20 }} />
                )}
              </IconButton>
            ) : (
              <Box sx={{ p: 0.25, display: 'inline-flex', alignItems: 'center' }}>
                <KeyboardArrowRightRoundedIcon sx={{ fontSize: 20, color: '#CBD5E1' }} />
              </Box>
            )}

            <Typography
              component="span"
              sx={{
                fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace",
                fontWeight: 700,
                fontSize: '0.925rem',
                color: '#101828',
              }}
            >
              {fnData.fnNome.endsWith(')') ? fnData.fnNome : `${fnData.fnNome}()`}
            </Typography>
          </Box>
        </TableCell>

        {/* Coluna 2: Tentativas */}
        <TableCell sx={{ fontSize: '0.875rem', color: '#101828', fontWeight: 600 }}>
          {fnData.tentativasCount}
        </TableCell>

        {/* Coluna 3: Melhor Nota */}
        <TableCell sx={{ fontSize: '0.875rem', color: '#101828', fontWeight: 600 }}>
          {hideGrade ? (
            '—'
          ) : fnData.melhorNota !== null ? (
            `${formatGrade(fnData.melhorNota)} / ${formatGrade(fnData.peso)}`
          ) : (
            '—'
          )}
        </TableCell>

        {/* Coluna 4: Último Envio */}
        <TableCell sx={{ fontSize: '0.85rem', color: '#475467' }}>
          {fnData.ultimoEnvio ? formatDateTimeShort(fnData.ultimoEnvio) : '—'}
        </TableCell>

        {/* Coluna 5: Ação / Status (sem botão redundante de ocultar tentativas) */}
        <TableCell align="right">
          {!hasAttempts && (
            <Typography sx={{ fontSize: '0.825rem', color: '#98A2B3', fontWeight: 500 }}>
              Sem tentativas
            </Typography>
          )}
        </TableCell>
      </TableRow>

      {/* Subtabela de Tentativas (Colapsável) */}
      {hasAttempts && (
        <TableRow sx={{ bgcolor: '#F8FAFC' }}>
          <TableCell colSpan={5} sx={{ p: 0, borderBottom: '1px solid #EAECF0' }}>
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box sx={{ px: 3, pb: 2.5, pt: 0.5 }}>
                <TableContainer
                  sx={{
                    bgcolor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden',
                  }}
                >
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                      <TableRow sx={{ '& th': { py: 1.2, px: 2, fontSize: '0.75rem', fontWeight: 600, color: '#667085' } }}>
                        <TableCell>Tentativa</TableCell>
                        <TableCell>Resultado</TableCell>
                        <TableCell>Nota</TableCell>
                        <TableCell>Enviada em</TableCell>
                        <TableCell align="right">Ação</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fnData.subs.map((sub, sIdx) => {
                        const attemptNumber = fnData.subs.length - sIdx;
                        const isBest = sub.uuid === fnData.melhorTentativaUuid;
                        const isCompilationError =
                          (sub.status || '').toUpperCase() === 'ERRO_COMPILACAO';

                        return (
                          <TableRow
                            key={sub.uuid}
                            sx={{
                              '& td': {
                                py: 1.4,
                                px: 2,
                                borderBottom:
                                  sIdx === fnData.subs.length - 1
                                    ? 'none'
                                    : '1px solid #F2F4F7',
                              },
                              '&:hover': { bgcolor: '#F9FAFB' },
                            }}
                          >
                            {/* Número da tentativa + Badge "Melhor" */}
                            <TableCell sx={{ minWidth: 120 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#101828' }}>
                                  #{attemptNumber}
                                </Typography>
                                {isBest && (
                                  <Box
                                    sx={{
                                      px: 1,
                                      py: 0.2,
                                      borderRadius: '999px',
                                      bgcolor: '#ECFDF3',
                                      color: '#027A48',
                                      fontSize: '0.7rem',
                                      fontWeight: 700,
                                    }}
                                  >
                                    Melhor
                                  </Box>
                                )}
                              </Box>
                            </TableCell>

                            {/* Resultado */}
                            <TableCell>
                              <SubmissionResultChip
                                status={sub.status}
                                nota={sub.nota}
                                peso={fnData.peso}
                                isProva={isProva}
                                isEncerrada={isEncerrada}
                              />
                            </TableCell>

                            {/* Nota */}
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#101828' }}>
                              {hideGrade ? (
                                '—'
                              ) : isCompilationError || sub.nota == null ? (
                                '—'
                              ) : (
                                `${formatGrade(sub.nota)} / ${formatGrade(fnData.peso)}`
                              )}
                            </TableCell>

                            {/* Data/Hora de envio */}
                            <TableCell sx={{ fontSize: '0.825rem', color: '#475467' }}>
                              {formatDateTimeFull(sub.dataSubmissao)}
                            </TableCell>

                            {/* Botão Ver detalhes */}
                            <TableCell align="right">
                              <Box
                                onClick={() => onNavigateSubmission(sub.uuid)}
                                sx={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  color: '#1570EF',
                                  fontSize: '0.825rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'color 0.15s ease',
                                  '&:hover': { color: '#175CD3' },
                                }}
                              >
                                <span>Ver detalhes</span>
                                <ArrowForwardRoundedIcon sx={{ fontSize: 15 }} />
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ─── Card de Atividade Expansível ────────────────────────────────────────────

function ActivityHistoryCard({
  item,
  index,
  isExpanded,
  onToggleExpand,
  onNavigateSubmission,
  turmaNome,
}) {
  const palette = ACTIVITY_PALETTES[index % ACTIVITY_PALETTES.length];
  const IconComponent = palette.icon || DescriptionOutlinedIcon;

  const isProva = item.activity.tipo?.toUpperCase() === 'PROVA';
  const tipoLabel = isProva ? 'Prova avaliativa' : 'Exercício';
  
  // Exibição amigável do breadcrumb (ex: "Programação I • Turma A • Exercício")
  const formattedTurma = (turmaNome || 'Turma A').replace(' - ', ' • ');
  const breadcrumbText = `${formattedTurma} • ${tipoLabel}`;

  const hideGrade = isProva && !item.isEncerrada;

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: '16px',
        borderColor: isExpanded ? '#D1E9FF' : '#EAECF0',
        bgcolor: '#FFFFFF',
        boxShadow: isExpanded
          ? '0 6px 18px rgba(16, 24, 40, 0.05)'
          : '0 1px 3px rgba(16, 24, 40, 0.03)',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
        mb: 2,
      }}
    >
      {/* ─── Cabeçalho da Atividade (Linha Clicável) ────────────────────────── */}
      <Box
        onClick={onToggleExpand}
        sx={{
          p: { xs: 2, sm: 2.5 },
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          cursor: 'pointer',
          userSelect: 'none',
          bgcolor: '#FFFFFF',
          transition: 'background-color 0.15s ease',
          '&:hover': { bgcolor: '#FBFDFE' },
        }}
      >
        {/* Lado Esquerdo: Ícone + Título + Subtítulo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: '1 1 300px', minWidth: 0 }}>
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
            <IconComponent sx={{ fontSize: 24 }} />
          </Box>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: '1rem',
                color: '#101828',
                lineHeight: 1.3,
                mb: 0.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.activity.titulo}
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
              {breadcrumbText}
            </Typography>
          </Box>
        </Box>

        {/* Lado Direito: Métricas + Status Chip + Chevron */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: { xs: 'space-between', md: 'flex-end' },
            gap: { xs: 1.5, sm: 2.5 },
          }}
        >
          {/* Último Envio */}
          <Typography sx={{ fontSize: '0.8rem', color: '#667085' }}>
            Último envio:{' '}
            <Box component="span" sx={{ color: '#344054', fontWeight: 500 }}>
              {formatDateTimeFull(item.ultimoEnvioAtividade)}
            </Box>
          </Typography>

          {/* Nota Atual / Final */}
          <Typography sx={{ fontSize: '0.8rem', color: '#667085' }}>
            {item.isEncerrada ? 'Nota:' : 'Nota atual:'}{' '}
            {hideGrade ? (
              <Box component="span" sx={{ color: '#667085', fontStyle: 'italic', fontSize: '0.825rem' }}>
                Oculta até encerramento
              </Box>
            ) : (
              <Box component="span" sx={{ fontWeight: 800, color: '#101828', fontSize: '0.9rem' }}>
                {formatGrade(item.notaAtual)} / {formatGrade(item.totalPontos)}
              </Box>
            )}
          </Typography>

          {/* Contador de funções com envio */}
          <Typography sx={{ fontSize: '0.8rem', color: '#475467', fontWeight: 500 }}>
            {item.funcoesComEnvio} de {item.totalFuncoes} funções com envio
          </Typography>

          {/* Chip Aberta / Encerrada */}
          <Box
            sx={{
              px: 1.4,
              py: 0.35,
              borderRadius: '999px',
              bgcolor: item.isEncerrada ? '#F2F4F7' : '#EFF8FF',
              color: item.isEncerrada ? '#344054' : '#175CD3',
              fontSize: '0.74rem',
              fontWeight: 700,
            }}
          >
            {item.isEncerrada ? 'Encerrada' : 'Aberta'}
          </Box>

          {/* Ícone Chevron */}
          <IconButton size="small" sx={{ color: '#667085', p: 0.5 }}>
            {isExpanded ? (
              <KeyboardArrowUpRoundedIcon sx={{ fontSize: 22 }} />
            ) : (
              <KeyboardArrowDownRoundedIcon sx={{ fontSize: 22 }} />
            )}
          </IconButton>
        </Box>
      </Box>

      {/* ─── Conteúdo Expansível: Tabela de Funções ──────────────────────────── */}
      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <Box sx={{ borderTop: '1px solid #EAECF0' }}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow
                  sx={{
                    '& th': {
                      py: 1.4,
                      px: 2.5,
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      color: '#667085',
                      borderBottom: '1px solid #EAECF0',
                    },
                  }}
                >
                  <TableCell>Função</TableCell>
                  <TableCell>Tentativas</TableCell>
                  <TableCell>Melhor nota</TableCell>
                  <TableCell>Último envio</TableCell>
                  <TableCell align="right" sx={{ pr: 3 }}>Ação</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {item.funcoesData.map((fnData, fnIdx) => (
                  <FunctionAccordionRow
                    key={fnData.fnUuid || fnIdx}
                    fnData={fnData}
                    isProva={isProva}
                    isEncerrada={item.isEncerrada}
                    onNavigateSubmission={onNavigateSubmission}
                    isExpandedDefault={fnIdx === 0 && fnData.tentativasCount > 0}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Rodapé Informativo */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              px: 2.5,
              py: 1.75,
              borderTop: '1px solid #F2F4F7',
              bgcolor: '#FFFFFF',
            }}
          >
            <InfoOutlinedIcon sx={{ fontSize: 16, color: '#667085' }} />
            <Typography sx={{ fontSize: '0.78rem', color: '#667085' }}>
              A nota considera a melhor tentativa válida de cada função.
            </Typography>
          </Box>
        </Box>
      </Collapse>
    </Card>
  );
}

// ─── Página Principal ────────────────────────────────────────────────────────

export default function StudentHistoryPage() {
  const navigate = useNavigate();
  const { showError } = useSnackbar();
  const { turmas, turmaAtiva } = useTurmaContext();

  const [atividades, setAtividades] = useState([]);
  const [submissoes, setSubmissoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedActivities, setExpandedActivities] = useState({});
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'grade' | 'name'
  const [sortAnchorEl, setSortAnchorEl] = useState(null);

  // Mapeamento rápido de UUID para dados da turma
  const turmaMap = useMemo(() => {
    const map = {};
    for (const t of turmas || []) {
      map[t.uuid] = t;
    }
    return map;
  }, [turmas]);

  // Carrega apenas as Atividades da turma ativa do aluno e suas Submissões
  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      try {
        const [atividadesData, submissoesData] = await Promise.all([
          getAtividades(turmaAtiva?.uuid), // Filtra estritamente pela turma ativa
          getSubmissoes(),
        ]);

        if (active) {
          const atvs = Array.isArray(atividadesData) ? atividadesData : [];
          setAtividades(atvs);
          setSubmissoes(Array.isArray(submissoesData) ? submissoesData : []);

          // Expande a primeira atividade por padrão conforme o mockup
          if (atvs.length > 0) {
            setExpandedActivities({ [atvs[0].uuid]: true });
          }
        }
      } catch (err) {
        if (active) {
          showError(
            err.response?.data?.detail || 'Erro ao carregar o histórico de atividades'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [turmaAtiva?.uuid, showError]);

  // Agrupa e calcula as métricas consolidadas
  const activityItems = useMemo(() => {
    return atividades
      .filter((a) => {
        if (a.status === 'rascunho' || a.status === 'RASCUNHO') return false;
        if (turmaAtiva?.uuid && a.turmaUuid && a.turmaUuid !== turmaAtiva.uuid) return false;
        return true;
      })
      .map((activity) => {
        const subsOfActivity = submissoes.filter(
          (s) => s.atividadeUuid === activity.uuid
        );

        const funcoes = activity.funcoes || [];
        const totalFuncoes = funcoes.length;
        let totalPontos = 0;
        let notaAtual = 0;
        let funcoesComEnvio = 0;
        let ultimoEnvioAtividade = null;

        const isEncerrada = isActivityClosed(activity);

        const isProva = activity.tipo?.toUpperCase() === 'PROVA';

        const funcoesData = funcoes.map((fn) => {
          const fnUuid = fn.funcaoUuid || fn.uuid;
          const fnNome = fn.nomeFuncao || fn.nome || fn.nome_funcao || 'funcao';
          const peso = Number(fn.peso ?? fn.notaMaxima ?? fn.nota_maxima ?? 10);
          totalPontos += peso;

          const fnSubs = subsOfActivity
            .filter(
              (s) => s.funcaoUuid === fnUuid || s.funcaoAtividadeUuid === fnUuid
            )
            .sort(
              (a, b) =>
                new Date(b.dataSubmissao).getTime() -
                new Date(a.dataSubmissao).getTime()
            );

          const tentativasCount = fnSubs.length;
          if (tentativasCount > 0) {
            funcoesComEnvio++;
            const dateLast = fnSubs[0].dataSubmissao;
            if (
              !ultimoEnvioAtividade ||
              new Date(dateLast) > new Date(ultimoEnvioAtividade)
            ) {
              ultimoEnvioAtividade = dateLast;
            }
          }

          const notasValidas = fnSubs
            .map((s) => (s.nota == null ? 0 : Number(s.nota)))
            .filter((n) => !isNaN(n));
          const melhorNota =
            notasValidas.length > 0 ? Math.max(...notasValidas) : null;

          if (melhorNota !== null && (!isProva || isEncerrada)) {
            notaAtual += melhorNota;
          }

          let melhorTentativaUuid = null;
          if (melhorNota !== null && melhorNota > 0 && fnSubs.length > 0) {
            const bestSub = fnSubs.find((s) => Number(s.nota ?? 0) === melhorNota);
            melhorTentativaUuid = bestSub ? bestSub.uuid : null;
          }

          return {
            fn,
            fnUuid,
            fnNome,
            peso,
            tentativasCount,
            melhorNota,
            ultimoEnvio: fnSubs[0]?.dataSubmissao || null,
            subs: fnSubs,
            melhorTentativaUuid,
          };
        });

        if (totalPontos === 0) totalPontos = 10.0;

        return {
          activity,
          isProva,
          isEncerrada,
          totalFuncoes,
          funcoesComEnvio,
          totalPontos,
          notaAtual,
          ultimoEnvioAtividade,
          funcoesData,
        };
      });
  }, [atividades, submissoes, turmaAtiva]);

  // Filtro de busca e ordenação
  const filteredAndSorted = useMemo(() => {
    let result = [...activityItems];

    // Busca textual por título da atividade
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((item) =>
        item.activity.titulo?.toLowerCase().includes(q)
      );
    }

    // Ordenação
    result.sort((a, b) => {
      if (sortBy === 'recent') {
        const timeA = a.ultimoEnvioAtividade
          ? new Date(a.ultimoEnvioAtividade).getTime()
          : 0;
        const timeB = b.ultimoEnvioAtividade
          ? new Date(b.ultimoEnvioAtividade).getTime()
          : 0;
        return timeB - timeA;
      }
      if (sortBy === 'grade') {
        return b.notaAtual - a.notaAtual;
      }
      if (sortBy === 'name') {
        return (a.activity.titulo || '').localeCompare(b.activity.titulo || '');
      }
      return 0;
    });

    return result;
  }, [activityItems, search, sortBy]);

  const toggleActivityExpand = (uuid) => {
    setExpandedActivities((prev) => ({
      ...prev,
      [uuid]: !prev[uuid],
    }));
  };

  const handleNavigateSubmission = (subUuid) => {
    navigate(`/aluno/submissoes/${subUuid}`);
  };

  const sortLabel = {
    recent: 'Último envio ↓',
    grade: 'Maior nota ↓',
    name: 'Nome (A–Z)',
  }[sortBy];

  return (
    <Box className="fade-in" sx={{ pb: 6 }}>
      {/* ─── Cabeçalho da Página ────────────────────────────────────────── */}
      <Box sx={{ mb: 3.5 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '1.85rem', sm: '2.3rem' },
            color: '#101828',
            letterSpacing: '-0.025em',
            mb: 0.5,
          }}
        >
          Histórico
        </Typography>
        <Typography sx={{ color: '#475467', fontSize: '0.95rem' }}>
          Consulte suas tentativas e os resultados de cada atividade.
        </Typography>
      </Box>

      {/* ─── Barra de Busca e Ordenação ──────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 3,
          alignItems: 'center',
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        {/* Input de Busca */}
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar atividade pelo nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              bgcolor: '#FFFFFF',
              fontSize: '0.875rem',
              '& fieldset': { borderColor: '#E4E7EC' },
              '&:hover fieldset': { borderColor: '#CBD5E1' },
              '&.Mui-focused fieldset': { borderColor: '#1570EF' },
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 19, color: '#98A2B3' }} />
                </InputAdornment>
              ),
            },
          }}
        />

        {/* Botão de Ordenação */}
        <Button
          variant="outlined"
          onClick={(e) => setSortAnchorEl(e.currentTarget)}
          endIcon={<SouthRoundedIcon sx={{ fontSize: 15 }} />}
          sx={{
            borderColor: '#E4E7EC',
            color: '#344054',
            bgcolor: '#FFFFFF',
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.85rem',
            px: 2,
            py: 0.85,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            '&:hover': {
              borderColor: '#CBD5E1',
              bgcolor: '#F8FAFC',
            },
          }}
        >
          {sortLabel}
        </Button>

        <Menu
          anchorEl={sortAnchorEl}
          open={Boolean(sortAnchorEl)}
          onClose={() => setSortAnchorEl(null)}
          slotProps={{
            paper: {
              sx: { borderRadius: '10px', mt: 1, boxShadow: '0 4px 16px rgba(16, 24, 40, 0.08)' },
            },
          }}
        >
          <MenuItem
            onClick={() => {
              setSortBy('recent');
              setSortAnchorEl(null);
            }}
            selected={sortBy === 'recent'}
          >
            Último envio ↓
          </MenuItem>
          <MenuItem
            onClick={() => {
              setSortBy('grade');
              setSortAnchorEl(null);
            }}
            selected={sortBy === 'grade'}
          >
            Maior nota ↓
          </MenuItem>
          <MenuItem
            onClick={() => {
              setSortBy('name');
              setSortAnchorEl(null);
            }}
            selected={sortBy === 'name'}
          >
            Nome (A–Z)
          </MenuItem>
        </Menu>
      </Box>

      {/* ─── Lista de Atividades com Acordeão ────────────────────────────── */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={84}
              sx={{ borderRadius: '16px' }}
            />
          ))}
        </Box>
      ) : filteredAndSorted.length === 0 ? (
        <Alert
          severity="info"
          variant="outlined"
          sx={{ borderRadius: '12px', bgcolor: '#F8FAFC', borderColor: '#E2E8F0', p: 3 }}
        >
          {search
            ? 'Nenhuma atividade encontrada para sua busca no histórico.'
            : 'Nenhuma atividade registrada no momento.'}
        </Alert>
      ) : (
        <Box>
          {filteredAndSorted.map((item, idx) => (
            <ActivityHistoryCard
              key={item.activity.uuid}
              item={item}
              index={idx}
              isExpanded={Boolean(expandedActivities[item.activity.uuid])}
              onToggleExpand={() => toggleActivityExpand(item.activity.uuid)}
              onNavigateSubmission={handleNavigateSubmission}
              turmaNome={turmaMap[item.activity.turmaUuid]?.nome || turmaAtiva?.nome}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

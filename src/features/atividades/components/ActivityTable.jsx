import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  alpha,
  useTheme,
  Tooltip,
  Divider,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';
import SwapVertRoundedIcon from '@mui/icons-material/SwapVertRounded';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';

function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatPeriodo(inicio, fim) {
  const fInicio = formatDate(inicio);
  const fFim = formatDate(fim);
  if (fInicio === '—' && fFim === '—') return '—';
  if (fInicio === '—') return `Até ${fFim}`;
  if (fFim === '—') return `A partir de ${fInicio}`;
  return `${fInicio} – ${fFim}`;
}

export default function ActivityTable({
  atividades = [],
  onView,
  onEdit,
  onDelete,
  onCloseActivity,
  onViewSubmissions,
  onEditDeadline,
  sortField,
  sortDirection,
  onSort,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Estado do menu de ações ⋮
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const handleOpenMenu = (event, activity) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedActivity(activity);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setSelectedActivity(null);
  };

  const renderSortableHeader = (label, field) => {
    const isCurrent = sortField === field;
    return (
      <Box
        onClick={() => onSort?.(field)}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          cursor: 'pointer',
          userSelect: 'none',
          color: isCurrent ? 'text.primary' : 'text.secondary',
          fontWeight: isCurrent ? 700 : 600,
          '&:hover': { color: 'text.primary' },
        }}
      >
        <span>{label}</span>
        <SwapVertRoundedIcon
          sx={{
            fontSize: 16,
            color: isCurrent ? 'primary.main' : 'text.disabled',
            transform: isCurrent && sortDirection === 'desc' ? 'rotate(180deg)' : 'none',
            transition: 'all 0.15s ease',
          }}
        />
      </Box>
    );
  };

  if (!atividades.length) {
    return (
      <Paper
        variant="outlined"
        sx={{
          py: 8,
          px: 3,
          textAlign: 'center',
          borderRadius: 3.5,
          borderColor: 'divider',
          boxShadow: 'none',
        }}
      >
        <DescriptionOutlinedIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }} />
        <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Nenhuma atividade encontrada com os filtros selecionados.
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.disabled', mt: 0.5 }}>
          Tente alterar o filtro de status ou o termo de busca.
        </Typography>
      </Paper>
    );
  }

  return (
    <>
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          borderRadius: 3.5,
          borderColor: 'divider',
          boxShadow: 'none',
          bgcolor: 'background.paper',
          overflow: 'hidden',
        }}
      >
        <Table sx={{ minWidth: 780 }}>
          <TableHead>
            <TableRow
              sx={{
                bgcolor: isDark
                  ? alpha(theme.palette.background.default, 0.5)
                  : '#F8FAFC',
              }}
            >
              <TableCell sx={{ py: 1.6, px: 2.5, fontSize: '0.8125rem' }}>
                {renderSortableHeader('Atividade', 'titulo')}
              </TableCell>
              <TableCell sx={{ py: 1.6, px: 2, fontSize: '0.8125rem' }}>
                {renderSortableHeader('Tipo', 'tipo')}
              </TableCell>
              <TableCell sx={{ py: 1.6, px: 2, fontSize: '0.8125rem' }}>
                {renderSortableHeader('Status', 'status')}
              </TableCell>
              <TableCell sx={{ py: 1.6, px: 2, fontSize: '0.8125rem' }}>
                {renderSortableHeader('Período', 'periodo')}
              </TableCell>
              <TableCell align="center" sx={{ py: 1.6, px: 2, fontSize: '0.8125rem' }}>
                {renderSortableHeader('Funções', 'funcoes')}
              </TableCell>
              <TableCell align="right" sx={{ py: 1.6, px: 2.5, fontSize: '0.8125rem', fontWeight: 600, color: 'text.secondary' }}>
                Ações
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {atividades.map((atv) => {
              const isProva = atv.tipo === 'PROVA';
              const isRascunho = atv.status === 'RASCUNHO';
              const isEncerrada = atv.status === 'ENCERRADA';
              const totalFuncoes = atv.funcoes?.length ?? 0;
              const periodoTexto = formatPeriodo(
                atv.inicioEm || atv.dataAbertura,
                atv.fimEm || atv.dataFechamento
              );

              return (
                <TableRow
                  key={atv.uuid}
                  sx={{
                    transition: 'background-color 0.15s ease',
                    '&:hover': {
                      bgcolor: isDark
                        ? alpha(theme.palette.action.hover, 0.4)
                        : '#FBFDFE',
                    },
                  }}
                >
                  {/* Coluna 1: Atividade */}
                  <TableCell sx={{ py: 2, px: 2.5, maxWidth: 300 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.9375rem',
                        color: 'text.primary',
                        lineHeight: 1.3,
                      }}
                    >
                      {atv.titulo}
                    </Typography>
                    {atv.descricao && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.75rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          mt: 0.35,
                          lineHeight: 1.2,
                        }}
                        title={atv.descricao}
                      >
                        {atv.descricao}
                      </Typography>
                    )}
                  </TableCell>

                  {/* Coluna 2: Tipo */}
                  <TableCell sx={{ py: 2, px: 2 }}>
                    {isProva ? (
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.75,
                          px: 1.2,
                          py: 0.5,
                          borderRadius: 2,
                          bgcolor: isDark ? alpha('#8B5CF6', 0.18) : '#F3E8FF',
                          color: isDark ? '#C4B5FD' : '#7C3AED',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <DescriptionOutlinedIcon sx={{ fontSize: 14 }} />
                        <span>Trabalho avaliativo</span>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.75,
                          px: 1.2,
                          py: 0.5,
                          borderRadius: 2,
                          bgcolor: isDark ? alpha('#3B82F6', 0.18) : '#EFF6FF',
                          color: isDark ? '#93C5FD' : '#2563EB',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <CodeRoundedIcon sx={{ fontSize: 15 }} />
                        <span>Exercício de prática</span>
                      </Box>
                    )}
                  </TableCell>

                  {/* Coluna 3: Status */}
                  <TableCell sx={{ py: 2, px: 2 }}>
                    {isRascunho ? (
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.75,
                          px: 1.2,
                          py: 0.5,
                          borderRadius: 2,
                          bgcolor: isDark ? alpha('#F59E0B', 0.18) : '#FFFBEB',
                          color: isDark ? '#FCD34D' : '#D97706',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: '#F59E0B',
                            flexShrink: 0,
                          }}
                        />
                        <span>Rascunho</span>
                      </Box>
                    ) : isEncerrada ? (
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.75,
                          px: 1.2,
                          py: 0.5,
                          borderRadius: 2,
                          bgcolor: isDark ? alpha('#64748B', 0.18) : '#F1F5F9',
                          color: isDark ? '#CBD5E1' : '#475569',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: '#64748B',
                            flexShrink: 0,
                          }}
                        />
                        <span>Encerrada</span>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.75,
                          px: 1.2,
                          py: 0.5,
                          borderRadius: 2,
                          bgcolor: isDark ? alpha('#10B981', 0.18) : '#ECFDF5',
                          color: isDark ? '#6EE7B7' : '#10B981',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: '#10B981',
                            flexShrink: 0,
                          }}
                        />
                        <span>Publicada</span>
                      </Box>
                    )}
                  </TableCell>

                  {/* Coluna 4: Período */}
                  <TableCell sx={{ py: 2, px: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.8125rem',
                        color: 'text.secondary',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {periodoTexto}
                    </Typography>
                  </TableCell>

                  {/* Coluna 5: Funções */}
                  <TableCell align="center" sx={{ py: 2, px: 2 }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 26,
                        height: 24,
                        px: 0.75,
                        borderRadius: 1.5,
                        bgcolor: isDark ? alpha('#3B82F6', 0.18) : '#EFF6FF',
                        border: '1px solid',
                        borderColor: isDark ? alpha('#3B82F6', 0.3) : '#BFDBFE',
                        color: isDark ? '#93C5FD' : '#2563EB',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                      }}
                    >
                      {totalFuncoes}
                    </Box>
                  </TableCell>

                  {/* Coluna 6: Ações */}
                  <TableCell align="right" sx={{ py: 2, px: 2.5 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 1,
                      }}
                    >
                      {isRascunho ? (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<EditOutlinedIcon sx={{ fontSize: 15 }} />}
                          onClick={() => onEdit?.(atv.uuid)}
                          sx={{
                            borderRadius: 2,
                            height: 34,
                            px: 1.75,
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            textTransform: 'none',
                            borderColor: '#93C5FD',
                            color: '#2563EB',
                            whiteSpace: 'nowrap',
                            '&:hover': {
                              borderColor: '#2563EB',
                              bgcolor: alpha('#2563EB', 0.05),
                            },
                          }}
                        >
                          Continuar edição
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 16 }} />}
                          onClick={() => onView?.(atv.uuid)}
                          sx={{
                            borderRadius: 2,
                            height: 34,
                            px: 2,
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            textTransform: 'none',
                            bgcolor: '#2563EB',
                            color: '#FFFFFF',
                            boxShadow: 'none',
                            whiteSpace: 'nowrap',
                            '&:hover': {
                              bgcolor: '#1D4ED8',
                              boxShadow: 'none',
                            },
                          }}
                        >
                          Abrir
                        </Button>
                      )}

                      {/* Botão de Mais Ações ⋮ */}
                      <IconButton
                        size="small"
                        onClick={(e) => handleOpenMenu(e, atv)}
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          color: 'text.secondary',
                          '&:hover': {
                            bgcolor: 'action.hover',
                            color: 'text.primary',
                          },
                        }}
                      >
                        <MoreVertRoundedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Menu dropdown das ações ⋮ */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.75,
              borderRadius: 2.5,
              minWidth: 195,
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: 'divider',
            },
          },
        }}
      >
        {selectedActivity?.status === 'RASCUNHO' ? (
          <MenuItem
            key="delete"
            onClick={() => {
              const atv = selectedActivity;
              handleCloseMenu();
              onDelete?.(atv);
            }}
            sx={{
              fontSize: '0.8125rem',
              py: 1,
              color: '#EF4444',
              '&:hover': { bgcolor: alpha('#EF4444', 0.08) },
            }}
          >
            <ListItemIcon sx={{ minWidth: 30, color: '#EF4444' }}>
              <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
            </ListItemIcon>
            <ListItemText
              primary="Excluir rascunho"
              primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: 600, color: '#EF4444' }}
            />
          </MenuItem>
        ) : (
          [
            <MenuItem
              key="submissions"
              onClick={() => {
                const uuid = selectedActivity.uuid;
                handleCloseMenu();
                onViewSubmissions?.(uuid);
              }}
              sx={{ fontSize: '0.8125rem', py: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 30 }}>
                <FactCheckOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              </ListItemIcon>
              <ListItemText primary="Ver submissões" primaryTypographyProps={{ fontSize: '0.8125rem' }} />
            </MenuItem>,
            <Tooltip
              key="edit-deadline"
              title={selectedActivity?.status === 'ENCERRADA' ? 'Atividades encerradas não podem ter o prazo alterado' : ''}
              placement="left"
              disableHoverListener={selectedActivity?.status !== 'ENCERRADA'}
            >
              <span>
                <MenuItem
                  disabled={selectedActivity?.status === 'ENCERRADA'}
                  onClick={() => {
                    const atv = selectedActivity;
                    handleCloseMenu();
                    onEditDeadline?.(atv);
                  }}
                  sx={{
                    fontSize: '0.8125rem',
                    py: 1,
                    color: selectedActivity?.status === 'ENCERRADA' ? 'text.disabled' : 'inherit',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <CalendarTodayOutlinedIcon
                      sx={{
                        fontSize: 17,
                        color: selectedActivity?.status === 'ENCERRADA' ? 'text.disabled' : 'text.secondary',
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText primary="Editar prazo" primaryTypographyProps={{ fontSize: '0.8125rem' }} />
                </MenuItem>
              </span>
            </Tooltip>,
            selectedActivity?.status === 'PUBLICADA' && (
              <MenuItem
                key="close"
                onClick={() => {
                  const atv = selectedActivity;
                  handleCloseMenu();
                  onCloseActivity?.(atv);
                }}
                sx={{ fontSize: '0.8125rem', py: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 30 }}>
                  <StopCircleOutlinedIcon sx={{ fontSize: 18, color: '#EA580C' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Encerrar atividade"
                  primaryTypographyProps={{ fontSize: '0.8125rem', color: '#EA580C', fontWeight: 500 }}
                />
              </MenuItem>
            ),
            <Divider key="divider-delete" sx={{ my: 0.5 }} />,
            (() => {
              const isEnc = selectedActivity?.status === 'ENCERRADA';
              const totalSubs =
                selectedActivity?.totalSubmissoes ??
                selectedActivity?.total_submissoes ??
                selectedActivity?.submissoes_count ??
                0;
              const hasSubs = totalSubs > 0;
              const canDel = !isEnc && !hasSubs;
              const tooltipMsg = !canDel
                ? isEnc && hasSubs
                  ? 'Atividades encerradas e com submissões não podem ser excluídas'
                  : hasSubs
                  ? `Esta atividade possui ${totalSubs} submissão(ões) de alunos registradas`
                  : 'Atividades encerradas não podem ser excluídas'
                : '';

              return (
                <Tooltip
                  key="delete"
                  title={tooltipMsg}
                  placement="left"
                  disableHoverListener={canDel}
                >
                  <span>
                    <MenuItem
                      disabled={!canDel}
                      onClick={() => {
                        const atv = selectedActivity;
                        handleCloseMenu();
                        onDelete?.(atv);
                      }}
                      sx={{
                        fontSize: '0.8125rem',
                        py: 1,
                        color: canDel ? '#EF4444' : 'text.disabled',
                        '&:hover': canDel ? { bgcolor: alpha('#EF4444', 0.08) } : {},
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 30, color: canDel ? '#EF4444' : 'text.disabled' }}>
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Excluir atividade"
                        primaryTypographyProps={{
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          color: canDel ? '#EF4444' : 'text.disabled',
                        }}
                      />
                    </MenuItem>
                  </span>
                </Tooltip>
              );
            })(),
          ].filter(Boolean)
        )}
      </Menu>
    </>
  );
}

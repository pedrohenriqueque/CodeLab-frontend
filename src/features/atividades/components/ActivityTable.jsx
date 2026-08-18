/**
 * ActivityTable — tabela de atividades do professor.
 *
 * Colunas: Título, Status, Abertura, Fechamento, Funções, Ações.
 * Props:
 *   atividades: array
 *   onView: (uuid) => void
 *   onEdit: (uuid) => void
 */

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  Box,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import ListAltIcon from '@mui/icons-material/ListAlt';

const STATUS_MAP = {
  rascunho: { label: 'Rascunho', color: 'warning' },
  publicado: { label: 'Publicado', color: 'success' },
  fechado: { label: 'Fechado', color: 'default' },
};

function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function ActivityTable({ atividades = [], onView, onEdit }) {
  if (!atividades.length) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Nenhuma atividade encontrada.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Título</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Abertura</TableCell>
            <TableCell>Fechamento</TableCell>
            <TableCell align="center">Funções</TableCell>
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {atividades.map((atv) => {
            const status = STATUS_MAP[atv.status] || STATUS_MAP.rascunho;
            return (
              <TableRow key={atv.uuid} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {atv.titulo}
                  </Typography>
                  {atv.descricao && (
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 300, display: 'block' }}>
                      {atv.descricao}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={status.label}
                    color={status.color}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{formatDate(atv.dataAbertura)}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{formatDate(atv.dataFechamento)}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={atv.funcoes?.length ?? 0}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Ver detalhes">
                    <IconButton size="small" onClick={() => onView?.(atv.uuid)} color="primary">
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Editar">
                    <IconButton size="small" onClick={() => onEdit?.(atv.uuid)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Ver submissões">
                    <IconButton size="small" onClick={() => onView?.(atv.uuid)}>
                      <ListAltIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

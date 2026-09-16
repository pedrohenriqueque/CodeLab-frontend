/**
 * ActivityDetailPage — detalhe de uma atividade com lista de funções e casos de teste contextuais.
 *
 * Layout:
 *   Topo: Breadcrumbs, título, status, ações rápidas de status e botões de gerência.
 *   Cards: Pontuação máxima, total de funções, status/tipo.
 *   Lista de Funções associadas:
 *     - Ordem, Dificuldade contextual, Pontos/Peso.
 *     - Ações: Configurar parâmetros/visibilidade, Desassociar da atividade, Ver submissões.
 *     - Detalhe expandido: Tabela de casos de teste contextuais com chips Visível / Oculto.
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
  Alert,
  Breadcrumbs,
  Link,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CodeIcon from '@mui/icons-material/Code';
import ListAltIcon from '@mui/icons-material/ListAlt';
import FunctionsIcon from '@mui/icons-material/Functions';
import EditIcon from '@mui/icons-material/Edit';
import PublishIcon from '@mui/icons-material/Publish';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import TuneIcon from '@mui/icons-material/Tune';

import useAtividadeDetail from '../hooks/useAtividadeDetail';
import ActivityForm from '../components/ActivityForm';
import AssociateFunctionDialog from '../components/AssociateFunctionDialog';
import { updateAtividade, removerFuncaoAtividade } from '../api';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';

const STATUS_MAP = {
  rascunho: { label: 'Rascunho', color: 'warning' },
  publicado: { label: 'Publicado', color: 'success' },
  fechado: { label: 'Fechado', color: 'default' },
};

const DIFICULDADE_MAP = {
  facil: { label: 'Fácil', color: 'success' },
  medio: { label: 'Médio', color: 'warning' },
  dificil: { label: 'Difícil', color: 'error' },
};

// Ações rápidas de status baseadas no status atual
const STATUS_ACTIONS = {
  rascunho: [
    { target: 'publicado', label: 'Publicar', icon: <PublishIcon />, color: 'success' },
    { target: 'fechado', label: 'Fechar', icon: <LockIcon />, color: 'default' },
  ],
  publicado: [
    { target: 'fechado', label: 'Fechar', icon: <LockIcon />, color: 'default' },
  ],
  fechado: [
    { target: 'publicado', label: 'Reabrir', icon: <LockOpenIcon />, color: 'success' },
  ],
};

export default function ActivityDetailPage() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { atividade, loading, error, refetch } = useAtividadeDetail(uuid);

  const [associateDialogOpen, setAssociateDialogOpen] = useState(false);
  const [editingAssociation, setEditingAssociation] = useState(null);
  const [removeConfirm, setRemoveConfirm] = useState(null); // funcao to remove
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { target, label }
  const [removing, setRemoving] = useState(false);

  const { showSuccess, showError } = useSnackbar();

  const handleEditAtividade = async (data) => {
    try {
      await updateAtividade(uuid, data);
      showSuccess('Atividade atualizada com sucesso!');
      refetch();
    } catch (err) {
      showError(err.response?.data?.detail || 'Erro ao atualizar atividade');
      throw err;
    }
  };

  const handleStatusChange = async (targetStatus) => {
    try {
      if (targetStatus === 'liberar_notas') {
        await updateAtividade(uuid, { notasLiberadas: true });
        showSuccess('Notas liberadas para os alunos!');
      } else {
        await updateAtividade(uuid, { status: targetStatus });
        showSuccess(`Status alterado para "${targetStatus}"!`);
      }
      setConfirmAction(null);
      refetch();
    } catch (err) {
      showError(err.response?.data?.detail || 'Erro ao alterar status/notas');
      setConfirmAction(null);
    }
  };

  const handleConfirmRemoveFuncao = async () => {
    if (!removeConfirm) return;
    setRemoving(true);
    try {
      const fUuid = removeConfirm.funcaoUuid || removeConfirm.uuid;
      await removerFuncaoAtividade(uuid, fUuid);
      showSuccess(`Função "${removeConfirm.nomeFuncao}" desassociada da atividade com sucesso!`);
      setRemoveConfirm(null);
      refetch();
    } catch (err) {
      showError(err.response?.data?.detail || 'Erro ao desassociar função da atividade');
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Skeleton variant="text" width={200} height={32} />
        <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
        <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!atividade) {
    return <Alert severity="warning">Atividade não encontrada.</Alert>;
  }

  const status = STATUS_MAP[atividade.status] || STATUS_MAP.rascunho;
  const quickActions = STATUS_ACTIONS[atividade.status] ? [...STATUS_ACTIONS[atividade.status]] : [];

  if (atividade.tipo === 'prova' && !atividade.notasLiberadas) {
    quickActions.push({ target: 'liberar_notas', label: 'Liberar Notas', icon: <VisibilityIcon />, color: 'primary' });
  }

  const existingFuncaoUuids = (atividade.funcoes || []).map((f) => f.funcaoUuid || f.uuid);

  return (
    <Box className="fade-in">
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          underline="hover"
          color="inherit"
          sx={{ cursor: 'pointer', fontSize: '0.875rem' }}
          onClick={() => navigate('/atividades')}
        >
          Atividades
        </Link>
        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
          {atividade.titulo}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tooltip title="Voltar">
            <IconButton onClick={() => navigate('/atividades')}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h5">{atividade.titulo}</Typography>
              <Chip label={status.label} color={status.color} size="small" variant="outlined" />
            </Box>
            {atividade.descricao && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {atividade.descricao}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {quickActions.map((action) => (
            <Button
              key={action.target}
              variant="outlined"
              color={action.color}
              startIcon={action.icon}
              size="small"
              onClick={() => setConfirmAction(action)}
            >
              {action.label}
            </Button>
          ))}
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            size="small"
            onClick={() => navigate(`/atividades/${uuid}/editar`)}
          >
            Editar Atividade
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingAssociation(null);
              setAssociateDialogOpen(true);
            }}
          >
            Associar da Biblioteca
          </Button>
        </Box>
      </Box>

      {/* Info Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        <Card>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="caption" color="text.secondary">Pontuação Máxima</Typography>
            <Typography variant="h6">{atividade.pontuacaoMaxima} pts</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="caption" color="text.secondary">Total de Funções</Typography>
            <Typography variant="h6">{atividade.funcoes?.length || 0}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="caption" color="text.secondary">Status / Tipo</Typography>
            <Typography variant="h6">
              {status.label}
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({atividade.tipo === 'prova' ? 'Prova' : 'Exercício'})
              </Typography>
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Lista de Funções */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FunctionsIcon color="primary" />
          <Typography variant="h6">Funções Associadas à Atividade</Typography>
        </Box>
        <Button
          size="small"
          variant="text"
          onClick={() => navigate('/funcoes')}
          sx={{ textTransform: 'none' }}
        >
          Ir para Biblioteca de Funções →
        </Button>
      </Box>

      {atividade.funcoes?.length === 0 ? (
        <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
          Nenhuma função associada a esta atividade. Clique em "Associar da Biblioteca" para vincular funções.
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {atividade.funcoes?.map((funcao, index) => {
            const difConfig = DIFICULDADE_MAP[funcao.dificuldade || funcao.dificuldadePadrao] || DIFICULDADE_MAP.facil;
            const targetFuncUuid = funcao.funcaoUuid || funcao.uuid;

            return (
              <Accordion
                key={funcao.uuid || targetFuncUuid}
                disableGutters
                sx={{
                  borderRadius: '12px !important',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:before': { display: 'none' },
                  overflow: 'hidden',
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 1 }}>
                    <Chip
                      label={`#${funcao.ordem !== undefined ? funcao.ordem : index}`}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                    <CodeIcon color="primary" fontSize="small" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                        {funcao.nomeFuncao}()
                      </Typography>
                      {funcao.descricao && (
                        <Typography variant="caption" color="text.secondary">
                          {funcao.descricao}
                        </Typography>
                      )}
                    </Box>

                    {/* Dificuldade Contextual */}
                    <Chip
                      label={difConfig.label}
                      size="small"
                      color={difConfig.color}
                      variant="outlined"
                    />

                    {/* Pontos / Peso */}
                    <Chip
                      label={`${funcao.peso ?? 10} pts`}
                      size="small"
                      color="primary"
                      variant="filled"
                    />

                    {/* Ações na função */}
                    <Tooltip title="Configurar peso, ordem e visibilidade">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingAssociation(funcao);
                          setAssociateDialogOpen(true);
                        }}
                      >
                        <TuneIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Ver submissões">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/atividades/${uuid}/funcao/${targetFuncUuid}/submissoes`);
                        }}
                      >
                        <ListAltIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Desassociar da atividade">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRemoveConfirm(funcao);
                        }}
                      >
                        <DeleteOutlineOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ backgroundColor: '#FAFBFC', pt: 2 }}>
                  <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Casos de Teste Selecionados para esta Atividade ({funcao.casosTeste?.length || 0})
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Gerencie visibilidade via botão de configuração acima.
                    </Typography>
                  </Box>

                  {(!funcao.casosTeste || funcao.casosTeste.length === 0) ? (
                    <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
                      Nenhum caso de teste configurado para esta função nesta atividade.
                    </Alert>
                  ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead sx={{ backgroundColor: 'action.hover' }}>
                          <TableRow>
                            <TableCell sx={{ width: 60 }}>#</TableCell>
                            <TableCell>Visibilidade</TableCell>
                            <TableCell>Inputs</TableCell>
                            <TableCell>Saída Esperada</TableCell>
                            <TableCell>Descrição</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {funcao.casosTeste.map((ct) => (
                            <TableRow key={ct.uuid || ct.casoTesteUuid}>
                              <TableCell sx={{ fontWeight: 600 }}>#{ct.numero}</TableCell>
                              <TableCell>
                                {ct.oculto ? (
                                  <Chip
                                    label="Oculto"
                                    size="small"
                                    color="default"
                                    icon={<VisibilityOffIcon fontSize="small" />}
                                    variant="outlined"
                                  />
                                ) : (
                                  <Chip
                                    label="Visível"
                                    size="small"
                                    color="success"
                                    icon={<VisibilityIcon fontSize="small" />}
                                    variant="outlined"
                                  />
                                )}
                              </TableCell>
                              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                {typeof ct.inputs === 'object' ? JSON.stringify(ct.inputs) : String(ct.inputs || '-')}
                              </TableCell>
                              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                {typeof ct.outputEsperado === 'object'
                                  ? JSON.stringify(ct.outputEsperado)
                                  : String(ct.outputEsperado || '-')}
                              </TableCell>
                              <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                                {ct.descricao || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}

      {/* Dialog Associar / Configurar Função */}
      <AssociateFunctionDialog
        open={associateDialogOpen}
        onClose={() => {
          setAssociateDialogOpen(false);
          setEditingAssociation(null);
        }}
        atividadeUuid={uuid}
        existingFuncaoUuids={existingFuncaoUuids}
        editingAssociation={editingAssociation}
        onSaved={refetch}
      />

      {/* Dialog editar atividade */}
      <ActivityForm
        open={editFormOpen}
        onClose={() => setEditFormOpen(false)}
        onSave={handleEditAtividade}
        initialData={atividade}
      />

      {/* Dialog de confirmação de remoção da função */}
      <Dialog
        open={!!removeConfirm}
        onClose={() => setRemoveConfirm(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, color: 'error.main' }}>
          Desassociar Função
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Tem certeza que deseja desassociar a função <strong>{removeConfirm?.nomeFuncao}</strong> desta atividade?
          </Typography>
          <Alert severity="info" variant="outlined" sx={{ mt: 2, borderRadius: 2 }}>
            A função <strong>continuará disponível na Biblioteca de Funções</strong> e poderá ser reutilizada em outras atividades. Ela apenas deixará de fazer parte desta atividade.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setRemoveConfirm(null)} disabled={removing}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmRemoveFuncao}
            disabled={removing}
          >
            {removing ? 'Removendo...' : 'Desassociar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmação de ação de status */}
      <Dialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Confirmar Ação</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja <strong>{confirmAction?.label?.toLowerCase()}</strong> esta atividade?
          </Typography>
          {confirmAction?.target === 'publicado' && (
            <Alert severity="info" variant="outlined" sx={{ mt: 2, borderRadius: 2 }}>
              Ao publicar, a atividade ficará visível para os alunos. Se a data de abertura não estiver definida, será
              preenchida automaticamente.
            </Alert>
          )}
          {confirmAction?.target === 'fechado' && (
            <Alert severity="warning" variant="outlined" sx={{ mt: 2, borderRadius: 2 }}>
              Ao fechar, os alunos não poderão mais enviar submissões.
            </Alert>
          )}
          {confirmAction?.target === 'liberar_notas' && (
            <Alert severity="info" variant="outlined" sx={{ mt: 2, borderRadius: 2 }}>
              Ao liberar as notas desta prova, os alunos poderão visualizar a nota final e o feedback dos testes.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setConfirmAction(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color={confirmAction?.color || 'primary'}
            onClick={() => handleStatusChange(confirmAction.target)}
          >
            {confirmAction?.label}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

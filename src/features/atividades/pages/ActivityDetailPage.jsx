/**
 * ActivityDetailPage — detalhe de uma atividade com lista de funções.
 *
 * Layout em duas colunas:
 *   Esquerda: info da atividade
 *   Direita: lista de funções (cards) com casos de teste expandíveis
 *
 * Inclui: Editar Atividade (dialog), ações rápidas de status.
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

import useAtividadeDetail from '../hooks/useAtividadeDetail';
import FuncaoForm from '../components/FuncaoForm';
import ActivityForm from '../components/ActivityForm';
import CasosTesteTable from '../components/CasosTesteTable';
import { createFuncao, updateAtividade } from '../api';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';

const STATUS_MAP = {
  rascunho: { label: 'Rascunho', color: 'warning' },
  publicado: { label: 'Publicado', color: 'success' },
  fechado: { label: 'Fechado', color: 'default' },
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
  const [funcaoFormOpen, setFuncaoFormOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { target, label }
  const { showSuccess, showError } = useSnackbar();

  const handleCreateFuncao = async (data) => {
    try {
      await createFuncao(uuid, data);
      showSuccess('Função criada com sucesso!');
      refetch();
    } catch (err) {
      showError(err.response?.data?.detail || 'Erro ao criar função');
      throw err;
    }
  };

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
            onClick={() => setEditFormOpen(true)}
          >
            Editar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setFuncaoFormOpen(true)}
          >
            Adicionar Função
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <FunctionsIcon color="primary" />
        <Typography variant="h6">Funções da Atividade</Typography>
      </Box>

      {atividade.funcoes?.length === 0 ? (
        <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
          Nenhuma função cadastrada. Clique em "Adicionar Função" para começar.
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {atividade.funcoes?.map((funcao) => (
            <Accordion
              key={funcao.uuid}
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 2 }}>
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
                  <Chip label={`${funcao.pontos} pts`} size="small" color="primary" variant="outlined" />
                  <Tooltip title="Ver submissões">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/atividades/${uuid}/funcao/${funcao.uuid}/submissoes`);
                      }}
                    >
                      <ListAltIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ backgroundColor: '#FAFBFC', pt: 2 }}>
                <CasosTesteTable
                  funcaoUuid={funcao.uuid}
                  parametros={funcao.parametros || []}
                />
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* Dialog nova função */}
      <FuncaoForm
        open={funcaoFormOpen}
        onClose={() => setFuncaoFormOpen(false)}
        onSave={handleCreateFuncao}
      />

      {/* Dialog editar atividade */}
      <ActivityForm
        open={editFormOpen}
        onClose={() => setEditFormOpen(false)}
        onSave={handleEditAtividade}
        initialData={atividade}
      />

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

import { useNavigate } from 'react-router-dom';
import { Box, ButtonBase, CircularProgress, Tooltip, Typography } from '@mui/material';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import { useTurmaContext } from '../context/TurmaContext';

export default function TurmaSelector() {
  const navigate = useNavigate();
  const { turmaAtiva, loadingTurmas } = useTurmaContext();
  if (loadingTurmas && !turmaAtiva) return <Box sx={{ px: 2, py: 1.5 }}><CircularProgress size={18} /></Box>;
  return <Box sx={{ px: 2, mb: 1.5 }}><Tooltip title="Trocar de turma" arrow placement="right"><ButtonBase onClick={() => navigate('/turmas')} sx={{ width: '100%', p: 1.25, borderRadius: 2.5, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.25, textAlign: 'left' }}><Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'grid', placeItems: 'center' }}><GroupsOutlinedIcon sx={{ fontSize: 18 }} /></Box><Box sx={{ minWidth: 0 }}><Typography variant="caption" color="text.secondary" fontWeight={700}>TURMA ATUAL</Typography><Typography variant="body2" noWrap fontWeight={700}>{turmaAtiva?.nome || 'Trocar turma'}</Typography></Box></ButtonBase></Tooltip></Box>;
}

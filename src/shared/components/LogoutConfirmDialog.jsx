import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';

export default function LogoutConfirmDialog({ open, onClose, onConfirm }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 0.5,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', pb: 1 }}>
        Sair da conta?
      </DialogTitle>
      <DialogContent sx={{ pb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Tem certeza de que deseja encerrar sua sessão no CodeLab?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, pt: 0, gap: 1 }}>
        <Button
          onClick={onClose}
          color="inherit"
          sx={{ fontWeight: 600, textTransform: 'none' }}
        >
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          sx={{ fontWeight: 700, textTransform: 'none', px: 2.5 }}
        >
          Sair
        </Button>
      </DialogActions>
    </Dialog>
  );
}

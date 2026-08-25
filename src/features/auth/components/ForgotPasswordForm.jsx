/**
 * ForgotPasswordForm — formulário de recuperação e redefinição de senha.
 *
 * Permite ao usuário informar o e-mail cadastrado e definir a nova senha diretamente
 * com validação de força e confirmação de senha em tempo real.
 */

import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Collapse,
} from '@mui/material';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import KeyIcon from '@mui/icons-material/Key';

import PasswordStrengthMeter from './PasswordStrengthMeter';
import {
  validateEmail,
  validateSenhaCadastro,
  validateConfirmarSenha,
} from '../utils/authValidation';

export default function ForgotPasswordForm({ onSubmit, loading, error, onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field) => {
    let err = '';
    if (field === 'email') {
      err = validateEmail(email);
    } else if (field === 'novaSenha') {
      err = validateSenhaCadastro(novaSenha);
      if (confirmarSenha) {
        setErrors((prev) => ({
          ...prev,
          confirmarSenha: validateConfirmarSenha(novaSenha, confirmarSenha),
        }));
      }
    } else if (field === 'confirmarSenha') {
      err = validateConfirmarSenha(novaSenha, confirmarSenha);
    }
    setErrors((prev) => ({ ...prev, [field]: err }));
    return !err;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ email: true, novaSenha: true, confirmarSenha: true });

    const vEmail = validateField('email');
    const vSenha = validateField('novaSenha');
    const vConfirm = validateField('confirmarSenha');

    if (vEmail && vSenha && vConfirm) {
      onSubmit(email, novaSenha);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Collapse in={!!error}>
        {error && (
          <Alert severity="error" variant="filled" sx={{ borderRadius: 2, fontSize: '0.85rem' }}>
            {error}
          </Alert>
        )}
      </Collapse>

      <TextField
        id="forgot-email"
        label="E-mail cadastrado"
        placeholder="seu@universidade.edu.br"
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (touched.email) {
            setErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }));
          }
        }}
        onBlur={handleBlur('email')}
        error={touched.email && !!errors.email}
        helperText={touched.email && errors.email}
        required
        fullWidth
        autoFocus
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SchoolOutlinedIcon color={touched.email && errors.email ? 'error' : 'action'} fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      <TextField
        id="forgot-nova-senha"
        label="Nova senha"
        placeholder="••••••••"
        type={showPassword ? 'text' : 'password'}
        value={novaSenha}
        onChange={(e) => {
          setNovaSenha(e.target.value);
          if (touched.novaSenha) {
            setErrors((prev) => ({ ...prev, novaSenha: validateSenhaCadastro(e.target.value) }));
          }
        }}
        onBlur={handleBlur('novaSenha')}
        error={touched.novaSenha && !!errors.novaSenha}
        helperText={touched.novaSenha && errors.novaSenha}
        required
        fullWidth
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlinedIcon color={touched.novaSenha && errors.novaSenha ? 'error' : 'action'} fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="alternar visibilidade da senha"
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  size="small"
                >
                  {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <PasswordStrengthMeter password={novaSenha} />

      <TextField
        id="forgot-confirmar-senha"
        label="Confirmar nova senha"
        placeholder="••••••••"
        type={showConfirmPassword ? 'text' : 'password'}
        value={confirmarSenha}
        onChange={(e) => {
          setConfirmarSenha(e.target.value);
          if (touched.confirmarSenha) {
            setErrors((prev) => ({
              ...prev,
              confirmarSenha: validateConfirmarSenha(novaSenha, e.target.value),
            }));
          }
        }}
        onBlur={handleBlur('confirmarSenha')}
        error={touched.confirmarSenha && !!errors.confirmarSenha}
        helperText={touched.confirmarSenha && errors.confirmarSenha}
        required
        fullWidth
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlinedIcon color={touched.confirmarSenha && errors.confirmarSenha ? 'error' : 'action'} fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="alternar visibilidade da confirmação de senha"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  edge="end"
                  size="small"
                >
                  {showConfirmPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <Button
        id="forgot-submit"
        type="submit"
        variant="contained"
        size="large"
        disabled={loading}
        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <KeyIcon />}
        sx={{
          mt: 1,
          py: 1.3,
          fontSize: '0.95rem',
          fontWeight: 700,
        }}
      >
        {loading ? 'Redefinindo senha...' : 'Salvar nova senha'}
      </Button>
    </Box>
  );
}

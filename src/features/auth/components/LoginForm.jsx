/**
 * LoginForm — formulário de login com validações em tempo real e tratamento de erros.
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
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';
import { validateEmail } from '../utils/authValidation';

export default function LoginForm({ onSubmit, loading, error, onForgotPassword }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field) => {
    let err = '';
    if (field === 'email') {
      err = validateEmail(email);
    } else if (field === 'senha') {
      if (!senha) err = 'Informe a sua senha.';
    }
    setErrors((prev) => ({ ...prev, [field]: err }));
    return !err;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const emailValid = validateField('email');
    const senhaValid = validateField('senha');
    setTouched({ email: true, senha: true });

    if (emailValid && senhaValid) {
      onSubmit(email, senha);
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
        id="login-email"
        label="E-mail"
        placeholder="seu@email.com"
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (touched.email) {
            setErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }));
          }
        }}
        onBlur={() => handleBlur('email')}
        error={touched.email && !!errors.email}
        helperText={touched.email && errors.email}
        required
        fullWidth
        autoFocus
        autoComplete="email"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <EmailOutlinedIcon color={touched.email && errors.email ? 'error' : 'action'} fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      <TextField
        id="login-senha"
        label="Senha"
        placeholder="••••••••"
        type={showPassword ? 'text' : 'password'}
        value={senha}
        onChange={(e) => {
          setSenha(e.target.value);
          if (touched.senha) {
            setErrors((prev) => ({ ...prev, senha: e.target.value ? '' : 'Informe a sua senha.' }));
          }
        }}
        onBlur={() => handleBlur('senha')}
        error={touched.senha && !!errors.senha}
        helperText={touched.senha && errors.senha}
        required
        fullWidth
        autoComplete="current-password"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlinedIcon color={touched.senha && errors.senha ? 'error' : 'action'} fontSize="small" />
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

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1 }}>
        <Button
          variant="text"
          size="small"
          onClick={onForgotPassword}
          sx={{
            fontSize: '0.8rem',
            color: 'primary.main',
            fontWeight: 600,
            textTransform: 'none',
            p: 0,
            minWidth: 'auto',
            '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
          }}
        >
          Esqueceu sua senha?
        </Button>
      </Box>

      <Button
        id="login-submit"
        type="submit"
        variant="contained"
        size="large"
        disabled={loading}
        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <LoginIcon />}
        sx={{
          mt: 0.5,
          py: 1.3,
          fontSize: '0.95rem',
          fontWeight: 700,
        }}
      >
        {loading ? 'Entrando no sistema...' : 'Entrar'}
      </Button>
    </Box>
  );
}

/**
 * RegisterForm — formulário de registro de aluno.
 *
 * Campos:
 * - Nome completo* (Seu nome)
 * - Matrícula* (Ex: 20231001)
 * - E-mail institucional* (seu@universidade.edu.br)
 * - Senha* (Mínimo 8 caracteres, maiúscula e caractere especial)
 * - Confirmar senha*
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
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';

import PasswordStrengthMeter from './PasswordStrengthMeter';
import {
  validateNome,
  validateMatricula,
  validateEmail,
  validateSenhaCadastro,
  validateConfirmarSenha,
} from '../utils/authValidation';

export default function RegisterForm({ onSubmit, loading, error }) {
  const [formData, setFormData] = useState({
    nome: '',
    matricula: '',
    email: '',
    senha: '',
    confirmarSenha: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (touched[field]) {
      runFieldValidation(field, value);
    }
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    runFieldValidation(field, formData[field]);
  };

  const runFieldValidation = (field, value) => {
    let err = '';
    switch (field) {
      case 'nome':
        err = validateNome(value);
        break;
      case 'matricula':
        err = validateMatricula(value);
        break;
      case 'email':
        err = validateEmail(value, { requireInstitutional: true });
        break;
      case 'senha':
        err = validateSenhaCadastro(value);
        if (formData.confirmarSenha) {
          setErrors((prev) => ({
            ...prev,
            confirmarSenha: validateConfirmarSenha(value, formData.confirmarSenha),
          }));
        }
        break;
      case 'confirmarSenha':
        err = validateConfirmarSenha(formData.senha, value);
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [field]: err }));
    return !err;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const allTouched = {
      nome: true,
      matricula: true,
      email: true,
      senha: true,
      confirmarSenha: true,
    };
    setTouched(allTouched);

    const vNome = runFieldValidation('nome', formData.nome);
    const vMatricula = runFieldValidation('matricula', formData.matricula);
    const vEmail = runFieldValidation('email', formData.email);
    const vSenha = runFieldValidation('senha', formData.senha);
    const vConfirm = runFieldValidation('confirmarSenha', formData.confirmarSenha);

    if (vNome && vMatricula && vEmail && vSenha && vConfirm) {
      onSubmit(formData);
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

      {/* Nome Completo */}
      <TextField
        id="register-nome"
        label="Nome completo"
        placeholder="Seu nome completo"
        value={formData.nome}
        onChange={handleChange('nome')}
        onBlur={handleBlur('nome')}
        error={touched.nome && !!errors.nome}
        helperText={touched.nome && errors.nome}
        required
        fullWidth
        autoFocus
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <PersonOutlinedIcon color={touched.nome && errors.nome ? 'error' : 'action'} fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      {/* Matrícula */}
      <TextField
        id="register-matricula"
        label="Matrícula"
        placeholder="Ex: 20231001"
        value={formData.matricula}
        onChange={handleChange('matricula')}
        onBlur={handleBlur('matricula')}
        error={touched.matricula && !!errors.matricula}
        helperText={touched.matricula && errors.matricula}
        required
        fullWidth
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <BadgeOutlinedIcon color={touched.matricula && errors.matricula ? 'error' : 'action'} fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      {/* E-mail Institucional */}
      <TextField
        id="register-email"
        label="E-mail institucional"
        placeholder="seu@universidade.edu.br"
        type="email"
        value={formData.email}
        onChange={handleChange('email')}
        onBlur={handleBlur('email')}
        error={touched.email && !!errors.email}
        helperText={touched.email && errors.email}
        required
        fullWidth
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

      {/* Senha */}
      <TextField
        id="register-senha"
        label="Senha"
        placeholder="••••••••"
        type={showPassword ? 'text' : 'password'}
        value={formData.senha}
        onChange={handleChange('senha')}
        onBlur={handleBlur('senha')}
        error={touched.senha && !!errors.senha}
        helperText={touched.senha && errors.senha}
        required
        fullWidth
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

      {/* Medidor de Força e Requisitos */}
      <PasswordStrengthMeter password={formData.senha} />

      {/* Confirmar Senha */}
      <TextField
        id="register-confirmar-senha"
        label="Confirmar senha"
        placeholder="••••••••"
        type={showConfirmPassword ? 'text' : 'password'}
        value={formData.confirmarSenha}
        onChange={handleChange('confirmarSenha')}
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
        id="register-submit"
        type="submit"
        variant="contained"
        size="large"
        disabled={loading}
        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <PersonAddAlt1Icon />}
        sx={{
          mt: 1,
          py: 1.3,
          fontSize: '0.95rem',
          fontWeight: 700,
        }}
      >
        {loading ? 'Cadastrando...' : 'Criar minha conta'}
      </Button>
    </Box>
  );
}

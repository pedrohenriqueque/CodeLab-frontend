import { Box, Typography, LinearProgress, Stack } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import { checkPasswordStrength } from '../utils/authValidation';

export default function PasswordStrengthMeter({ password }) {
  if (!password) return null;

  const { hasMinLength, hasUppercase, hasSpecialChar, score } = checkPasswordStrength(password);

  const getProgressColor = () => {
    if (score <= 1) return 'error';
    if (score === 2) return 'warning';
    return 'success';
  };

  const getProgressValue = () => {
    return (score / 3) * 100;
  };

  const requirements = [
    { label: 'Mínimo de 8 caracteres', met: hasMinLength },
    { label: 'Pelo menos uma letra maiúscula (A-Z)', met: hasUppercase },
    { label: 'Pelo menos um caractere especial (!@#$...)', met: hasSpecialChar },
  ];

  return (
    <Box sx={{ mt: 1, mb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Força da senha
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: score === 3 ? 'success.main' : score >= 2 ? 'warning.main' : 'error.main',
          }}
        >
          {score === 3 ? 'Forte' : score >= 2 ? 'Média' : 'Fraca'}
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={getProgressValue()}
        color={getProgressColor()}
        sx={{
          height: 5,
          borderRadius: 3,
          bgcolor: 'action.hover',
          mb: 1.5,
        }}
      />

      <Stack spacing={0.5}>
        {requirements.map((req, idx) => (
          <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {req.met ? (
              <CheckCircleRoundedIcon sx={{ fontSize: 15, color: 'success.main' }} />
            ) : (
              <CancelRoundedIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
            )}
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.75rem',
                color: req.met ? 'success.dark' : 'text.secondary',
                fontWeight: req.met ? 600 : 400,
                transition: 'all 0.2s ease',
              }}
            >
              {req.label}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

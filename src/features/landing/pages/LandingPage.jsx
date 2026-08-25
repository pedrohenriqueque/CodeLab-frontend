import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Chip,
  Paper,
  Grid,
  Stack,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import { useAuth } from '../../auth/hooks/useAuthProvider';

export default function LandingPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, isProfessor } = useAuth();

  const handleAccess = () => {
    if (user) {
      navigate(isProfessor ? '/dashboard' : '/aluno/atividades');
    } else {
      navigate('/login');
    }
  };

  const handleRegisterOrLogin = () => {
    if (user) {
      navigate(isProfessor ? '/dashboard' : '/aluno/atividades');
    } else {
      navigate('/login?tab=register');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar */}
      <Box
        component="header"
        sx={{
          py: 2,
          px: { xs: 2, md: 6 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        {/* Brand Logo & Name */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              boxShadow: '0 4px 12px rgba(21,101,192,0.25)',
            }}
          >
            <CodeIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: 'text.primary',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              Code<Box component="span" sx={{ color: 'primary.main' }}>Lab</Box>
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                display: { xs: 'none', sm: 'inline-block' },
                fontWeight: 500,
              }}
            >
              Avaliação automatizada
            </Typography>
          </Box>
        </Box>

        {/* Actions */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            onClick={handleAccess}
            sx={{
              color: 'text.primary',
              fontWeight: 600,
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            Entrar
          </Button>
          <Button
            variant="contained"
            onClick={handleRegisterOrLogin}
            sx={{
              fontWeight: 600,
              px: 2.5,
              py: 0.9,
              borderRadius: 2,
              bgcolor: 'primary.main',
              boxShadow: '0 4px 14px rgba(21,101,192,0.3)',
              '&:hover': {
                bgcolor: 'primary.dark',
                transform: 'translateY(-1px)',
              },
            }}
          >
            Criar conta
          </Button>
        </Stack>
      </Box>

      {/* Hero Section */}
      <Box
        sx={{
          flex: 1,
          pt: { xs: 6, md: 9 },
          pb: { xs: 8, md: 12 },
          background: `radial-gradient(ellipse at top left, ${alpha(theme.palette.primary.main, 0.06)} 0%, transparent 60%),
                       radial-gradient(ellipse at bottom right, ${alpha(theme.palette.secondary.main, 0.05)} 0%, transparent 50%)`,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 6, md: 4 }} alignItems="center">
            {/* Left Column: Presentation & CTA */}
            <Grid size={{ xs: 12, md: 6.5 }}>
              <Box sx={{ maxWidth: 560 }}>
                <Chip
                  icon={<CodeIcon sx={{ fontSize: '1rem !important', color: 'primary.main' }} />}
                  label="Disciplinas introdutórias de programação em C"
                  size="small"
                  sx={{
                    mb: 3,
                    fontWeight: 600,
                    px: 1,
                    py: 1.8,
                    borderRadius: '16px',
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    color: 'primary.main',
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                  }}
                />

                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: '2.4rem', sm: '3.1rem', md: '3.5rem' },
                    lineHeight: 1.15,
                    letterSpacing: '-0.03em',
                    color: 'text.primary',
                    mb: 2.5,
                  }}
                >
                  Correção automática de exercícios em C,{' '}
                  <Box
                    component="span"
                    sx={{
                      color: 'primary.main',
                      display: 'inline-block',
                      position: 'relative',
                    }}
                  >
                    sem trabalho manual.
                  </Box>
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.secondary',
                    fontSize: { xs: '1rem', md: '1.125rem' },
                    lineHeight: 1.65,
                    mb: 4,
                  }}
                >
                  O professor cria a atividade e define as funções e os casos de teste. O aluno envia o
                  arquivo{' '}
                  <Box
                    component="span"
                    sx={{
                      px: 0.8,
                      py: 0.2,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main',
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontWeight: 600,
                    }}
                  >
                    .c
                  </Box>{' '}
                  e recebe a nota, os casos que{' '}
                  <Box component="span" sx={{ color: 'error.main', fontWeight: 600 }}>
                    falharam
                  </Box>{' '}
                  e os logs de compilação e execução.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    onClick={handleAccess}
                    sx={{
                      py: 1.5,
                      px: 3.5,
                      borderRadius: 2,
                      fontSize: '1rem',
                      fontWeight: 700,
                      bgcolor: 'primary.main',
                      boxShadow: '0 6px 20px rgba(21,101,192,0.35)',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(21,101,192,0.45)',
                      },
                    }}
                  >
                    Acessar o sistema
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={handleRegisterOrLogin}
                    sx={{
                      py: 1.5,
                      px: 3,
                      borderRadius: 2,
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: 'text.primary',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                      },
                    }}
                  >
                    Criar conta de aluno
                  </Button>
                </Stack>
              </Box>
            </Grid>

            {/* Right Column: Interactive Mock Window */}
            <Grid size={{ xs: 12, md: 5.5 }}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden',
                  bgcolor: theme.palette.mode === 'dark' ? '#131B2E' : '#FFFFFF',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                {/* Window Header */}
                <Box
                  sx={{
                    px: 2.5,
                    py: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: alpha(theme.palette.text.primary, 0.02),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#EF5350' }} />
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#FFB74D' }} />
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#66BB6A' }} />
                    <Typography
                      variant="caption"
                      sx={{
                        ml: 1.5,
                        fontFamily: 'monospace',
                        color: 'text.secondary',
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                      }}
                    >
                      solucao.c
                    </Typography>
                  </Stack>
                </Box>

                {/* Code Content */}
                <Box
                  sx={{
                    p: 3,
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: '0.875rem',
                    lineHeight: 1.7,
                    color: theme.palette.mode === 'dark' ? '#E2E8F0' : '#2D3748',
                    overflowX: 'auto',
                    whiteSpace: 'pre',
                  }}
                >
                  <span style={{ color: '#00897B' }}>#include</span> <span style={{ color: '#E53E3E' }}>&lt;stdio.h&gt;</span>
                  {'\n\n'}
                  <span style={{ color: '#1565C0', fontWeight: 'bold' }}>long</span> <span style={{ color: '#D97706', fontWeight: 600 }}>fatorial</span>(<span style={{ color: '#1565C0' }}>int</span> n) {'{\n'}
                  {'  '}<span style={{ color: '#1565C0', fontWeight: 'bold' }}>if</span> (n &lt;= <span style={{ color: '#7C3AED' }}>1</span>) <span style={{ color: '#1565C0', fontWeight: 'bold' }}>return</span> <span style={{ color: '#7C3AED' }}>1</span>;{'\n'}
                  {'  '}<span style={{ color: '#1565C0', fontWeight: 'bold' }}>return</span> n * fatorial(n - <span style={{ color: '#7C3AED' }}>1</span>);{'\n'}
                  {'}'}
                  {'\n\n'}
                  <span style={{ color: '#1565C0', fontWeight: 'bold' }}>int</span> <span style={{ color: '#D97706', fontWeight: 600 }}>fibonacci</span>(<span style={{ color: '#1565C0' }}>int</span> n) {'{\n'}
                  {'  '}<span style={{ color: '#1565C0', fontWeight: 'bold' }}>if</span> (n == <span style={{ color: '#7C3AED' }}>0</span>) <span style={{ color: '#1565C0', fontWeight: 'bold' }}>return</span> <span style={{ color: '#7C3AED' }}>0</span>;{'\n'}
                  {'  '}<span style={{ color: '#1565C0', fontWeight: 'bold' }}>if</span> (n == <span style={{ color: '#7C3AED' }}>1</span>) <span style={{ color: '#1565C0', fontWeight: 'bold' }}>return</span> <span style={{ color: '#7C3AED' }}>1</span>;{'\n'}
                  {'  '}<span style={{ color: '#1565C0', fontWeight: 'bold' }}>return</span> fibonacci(n - <span style={{ color: '#7C3AED' }}>1</span>){'\n'}
                  {'         '} + fibonacci(n - <span style={{ color: '#7C3AED' }}>2</span>);{'\n'}
                  {'}'}
                </Box>

                {/* Score / Execution Status Footer */}
                <Box
                  sx={{
                    px: 3,
                    py: 1.5,
                    bgcolor: alpha(theme.palette.success.main, 0.08),
                    borderTop: '1px solid',
                    borderColor: alpha(theme.palette.success.main, 0.2),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 18 }} />
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: 'success.main', fontSize: '0.85rem' }}
                    >
                      9 / 10 casos aprovados
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: 'success.dark',
                      bgcolor: alpha(theme.palette.success.main, 0.15),
                      px: 1.2,
                      py: 0.3,
                      borderRadius: 1.5,
                    }}
                  >
                    8.0 pts
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Divider />

      {/* Feature Step-by-Step Section (Como Funciona) */}
      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Typography
            variant="overline"
            sx={{
              display: 'block',
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: 'text.secondary',
              mb: 4,
              fontSize: '0.8rem',
            }}
          >
            COMO FUNCIONA
          </Typography>

          <Grid container spacing={4}>
            {/* Step 1 */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'primary.main',
                    }}
                  >
                    <DescriptionOutlinedIcon fontSize="small" />
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.85rem' }}>
                    01
                  </Typography>
                </Stack>

                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, fontSize: '1.05rem', color: 'text.primary' }}>
                  Professor define a atividade
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                  Cadastra cada função exigida — nome, parâmetros, tipo de retorno e pontuação — e
                  configura casos de teste visíveis ou ocultos.
                </Typography>
              </Box>
            </Grid>

            {/* Step 2 */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'primary.main',
                    }}
                  >
                    <CodeIcon fontSize="small" />
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.85rem' }}>
                    02
                  </Typography>
                </Stack>

                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, fontSize: '1.05rem', color: 'text.primary' }}>
                  Aluno envia o arquivo .c
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                  O sistema compila o código, executa todos os casos de teste e compara as saídas obtidas
                  com as esperadas — em segundos.
                </Typography>
              </Box>
            </Grid>

            {/* Step 3 */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'primary.main',
                    }}
                  >
                    <AssessmentOutlinedIcon fontSize="small" />
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.85rem' }}>
                    03
                  </Typography>
                </Stack>

                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, fontSize: '1.05rem', color: 'text.primary' }}>
                  Nota calculada automaticamente
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                  Cada função recebe pontuação proporcional aos casos aprovados. O aluno vê quais falharam
                  e os logs de compilação e execução.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default',
          textAlign: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          © {new Date().getFullYear()} CodeLab — Plataforma de avaliação automatizada de código C
        </Typography>
      </Box>
    </Box>
  );
}

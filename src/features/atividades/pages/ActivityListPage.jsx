/**
 * ActivityListPage — Dashboard do professor.
 *
 * - Stats cards no topo (total, publicados, rascunhos)
 * - Filtro por status + busca por título
 * - Tabela de atividades com ações
 * - FAB "Criar Atividade"
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FunctionsIcon from '@mui/icons-material/Functions';

import useAtividades from '../hooks/useAtividades';
import StatsCards from '../components/StatsCards';
import ActivityTable from '../components/ActivityTable';

export default function ActivityListPage() {
  const { atividades, loading, error, refetch } = useAtividades();
  const [statusFilter, setStatusFilter] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Filtros
  const filteredAtividades = useMemo(() => {
    let result = atividades;

    if (statusFilter !== 'todos') {
      result = result.filter((a) => a.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.titulo?.toLowerCase().includes(q) ||
          a.descricao?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [atividades, statusFilter, searchQuery]);

  return (
    <Box className="fade-in">
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4">Minhas Atividades</Typography>
          <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
            Gerencie suas listas de exercícios
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            id="btn-biblioteca-funcoes"
            variant="outlined"
            startIcon={<FunctionsIcon />}
            onClick={() => navigate('/funcoes')}
            size="large"
          >
            Biblioteca de Funções
          </Button>
          <Button
            id="btn-criar-atividade"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/atividades/criar')}
            size="large"
          >
            Criar Atividade
          </Button>
        </Box>
      </Box>

      {/* Stats */}
      {loading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2.5, mb: 3 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={90} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
      ) : (
        <StatsCards atividades={atividades} />
      )}

      {/* Filtros */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          onChange={(_, val) => val && setStatusFilter(val)}
          size="small"
        >
          <ToggleButton value="todos">Todos</ToggleButton>
          <ToggleButton value="rascunho">Rascunho</ToggleButton>
          <ToggleButton value="publicado">Publicado</ToggleButton>
          <ToggleButton value="fechado">Fechado</ToggleButton>
        </ToggleButtonGroup>

        <TextField
          id="search-atividades"
          placeholder="Buscar por título..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ minWidth: 260 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {/* Conteúdo */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={56} sx={{ mb: 1, borderRadius: 2 }} />
          ))}
        </Box>
      ) : (
        <ActivityTable
          atividades={filteredAtividades}
          onView={(uuid) => navigate(`/atividades/${uuid}`)}
          onEdit={(uuid) => navigate(`/atividades/${uuid}`)}
        />
      )}

      {/* Dialog criar atividade (mantido como fallback) */}
      {false && (
        <ActivityForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSave={handleCreateAtividade}
        />
      )}
    </Box>
  );
}

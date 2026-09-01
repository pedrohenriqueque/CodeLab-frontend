import httpClient from '../../shared/api/httpClient';

export const dashboardApi = {
  getEstatisticas: async () => {
    const { data } = await httpClient.get('/api/dashboard/estatisticas');
    return data;
  },

  getDashboardAluno: async () => {
    const { data } = await httpClient.get('/api/dashboard/aluno');
    return data;
  },
};

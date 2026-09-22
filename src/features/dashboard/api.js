import httpClient from '../../shared/api/httpClient';

export const dashboardApi = {
  getEstatisticas: async (turmaUuid) => {
    const { data } = await httpClient.get(`/api/turmas/${turmaUuid}/dashboard/professor`);
    return data;
  },

  getDashboardAluno: async (turmaUuid) => {
    const { data } = await httpClient.get(`/api/turmas/${turmaUuid}/dashboard/aluno`);
    return data;
  },
};

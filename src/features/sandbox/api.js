import httpClient from '../../shared/api/httpClient';

export const sandboxApi = {
  executarCodigo: async (codigo) => {
    const { data } = await httpClient.post('/api/sandbox', { codigo });
    return data;
  },
};

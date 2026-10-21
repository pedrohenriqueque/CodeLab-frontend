import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({
  cacheDir: 'node_modules/.vite-tests/activity-summaries',
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, ws: false },
  appType: 'custom',
});
const { getAtividades, getAtividadesResumo, getProgressoAtividade } = await server.ssrLoadModule('/src/features/atividades/api.js');
const { getSubmissoes, getSubmissao } = await server.ssrLoadModule('/src/features/submissoes/api.js');
const { default: httpClient } = await server.ssrLoadModule('/src/shared/api/httpClient.js');
const originalAdapter = httpClient.defaults.adapter;
const originalStorage = globalThis.localStorage;
globalThis.localStorage = { getItem: () => null };

after(async () => {
  httpClient.defaults.adapter = originalAdapter;
  if (originalStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = originalStorage;
  await server.close();
});

function respond(data, calls) {
  httpClient.defaults.adapter = async (config) => {
    calls.push({ url: config.url, params: config.params });
    return { data, status: 200, headers: {}, config };
  };
}

test('atividades e progresso chegam em uma requisição mesmo com várias atividades', async () => {
  const calls = [];
  respond(Array.from({ length: 50 }, (_, i) => ({
    uuid: `a-${i}`, inicioEm: '2030-01-01', fimEm: '2030-02-01',
    funcoes: [{ uuid: `f-${i}`, nome: 'somar', notaMaxima: '5.00' }],
    progresso: [{ funcaoAtividadeUuid: `f-${i}`, enviada: true, totalTentativas: 2, melhorNota: '0.00' }],
  })), calls);
  const activities = await getAtividades('turma-1');
  assert.deepEqual(calls, [{ url: '/api/atividades/resumo', params: { turmaUuid: 'turma-1' } }]);
  assert.equal(activities.length, 50);
  assert.equal(activities[0].dataAbertura, '2030-01-01');
  assert.equal(activities[0].funcoes[0].peso, 5);
  assert.equal(activities[0].progresso[0].melhorNota, 0);
  assert.equal(activities[0].progresso[0].tentativasUsadas, 2);
  assert.ok(!Object.hasOwn(activities[0].funcoes[0], 'casosTeste'));
  respond({ funcoes: [{ funcaoAtividadeUuid: 'f-0', enviada: true, totalTentativas: 2, melhorNota: '0.00' }] }, []);
  assert.deepEqual(await getProgressoAtividade('a-0'), activities[0].progresso);
});

test('resumo preserva nota bloqueada e turma sem atividades', async () => {
  respond([{ uuid: 'a', funcoes: [], progresso: [{ funcaoAtividadeUuid: 'f', melhorNota: null, totalTentativas: 1 }] }], []);
  const activities = await getAtividades('turma-1');
  assert.equal(activities[0].progresso[0].melhorNota, null);
  respond([], []);
  assert.deepEqual(await getAtividades('turma-vazia'), []);
});

test('listagem básica de atividades pede a turma ao backend', async () => {
  const calls = [];
  respond([{ uuid: 'a', inicioEm: '2030-01-01' }], calls);
  await getAtividadesResumo('turma-1');
  assert.deepEqual(calls, [{ url: '/api/atividades', params: { turmaUuid: 'turma-1' } }]);
});

test('histórico envia os filtros e usa a numeração real por aluno e função', async () => {
  const calls = [];
  respond([{ uuid: 's', funcaoAtividadeUuid: 'f', tentativaNumero: 8, nota: '0.00', status: 'AVALIADA' }], calls);
  const items = await getSubmissoes('f', 'AVALIADA', 'a', 'aluno', 'turma');
  assert.deepEqual(calls, [{ url: '/api/submissoes', params: {
    funcaoUuid: 'f', status: 'AVALIADA', atividadeUuid: 'a', alunoUuid: 'aluno', turmaUuid: 'turma',
  } }]);
  assert.equal(items[0].tentativaNumero, 8);
  assert.equal(items[0].nota, 0);
  assert.equal(items[0].codigoSubmetido, undefined);
});

test('detalhe recupera código, assinatura e retorno sem listar as funções da atividade', async () => {
  const calls = [];
  const codigo = 'int somar(int a) { return a; }';
  respond({ uuid: 's', codigoFonte: codigo, parametros: [{ nome: 'a', tipo: 'int' }],
    resultadosCasos: [{ retornoObtido: false, retornoEsperado: true }] }, calls);
  const detail = await getSubmissao('s', { includeParameters: true });
  assert.deepEqual(calls, [{ url: '/api/submissoes/s', params: undefined }]);
  assert.equal(detail.codigoSubmetido, codigo);
  assert.deepEqual(detail.parametros, [{ nome: 'a', tipo: 'int' }]);
  assert.equal(detail.resultadosCasos[0].retornoObtido, false);
});

test('falhas de consulta permanecem erros, sem simular listas vazias', async () => {
  httpClient.defaults.adapter = async () => { throw new Error('Conexão indisponível'); };
  await assert.rejects(getAtividades('turma'), /Conexão indisponível/);
  await assert.rejects(getSubmissoes(), /Conexão indisponível/);
  await assert.rejects(getSubmissao('s'), /Conexão indisponível/);
});

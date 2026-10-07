import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const server = await createServer({
  cacheDir: 'node_modules/.vite-tests/function-cases',
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, ws: false },
  appType: 'custom',
});
const { getFunctionTestCaseCount, getCasosParaAtividade } = await server.ssrLoadModule('/src/features/funcoes/api.js');
const { default: Notice } = await server.ssrLoadModule('/src/shared/components/NoVisibleTestCasesNotice.jsx');
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

test('distingue quantidade zero de uma quantidade ainda não fornecida pela API', () => {
  assert.equal(getFunctionTestCaseCount({ totalCasosTeste: 0 }), 0);
  assert.equal(getFunctionTestCaseCount({ total_casos_teste: 3 }), 3);
  assert.equal(getFunctionTestCaseCount({ casosTeste: [] }), 0);
  assert.equal(getFunctionTestCaseCount({}), undefined);
});

test('rejeita função sem casos mesmo quando a contagem da biblioteca está desatualizada', async () => {
  const calls = [];
  httpClient.defaults.adapter = async (config) => {
    calls.push(config.url);
    return { data: [], status: 200, headers: {}, config };
  };
  await assert.rejects(getCasosParaAtividade({ uuid: 'funcao-1', totalCasosTeste: 2 }), /ao menos um caso/);
  assert.deepEqual(calls, ['/api/funcoes/funcao-1/casos']);
});

test('falha ao consultar casos não é convertida em uma função adicionável sem casos', async () => {
  httpClient.defaults.adapter = async () => { throw new Error('Falha de conexão'); };
  await assert.rejects(getCasosParaAtividade({ uuid: 'funcao-1' }), /Falha de conexão/);
});

test('permite associação com apenas casos ocultos sem alterar visibilidade ou valores', async () => {
  httpClient.defaults.adapter = async (config) => ({
    data: [{ uuid: 'caso-1', entradas: [0], retornoEsperado: false, visibilidade: 'OCULTO', peso: 2 }],
    status: 200, headers: {}, config,
  });
  const casos = await getCasosParaAtividade({ uuid: 'funcao-1' });
  assert.equal(casos.length, 1);
  assert.equal(casos[0].oculto, true);
  assert.equal(casos[0].visible, false);
  assert.equal(casos[0].retornoEsperado, false);
  assert.deepEqual(casos[0].entradas, [0]);
  assert.equal(casos[0].peso, 2);
});

test('aviso de ausência de exemplos visíveis explica a avaliação sem inventar casos', () => {
  const html = renderToStaticMarkup(createElement(Notice));
  assert.ok(html.includes('Não há casos de teste visíveis'));
  assert.ok(html.includes('correção automática utiliza os casos cadastrados'));
  assert.ok(!html.includes('<table'));
  assert.ok(!html.includes('Sem casos cadastrados'));
});

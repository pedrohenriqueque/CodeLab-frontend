import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Usa o transformador JSX já existente no projeto, sem navegador ou backend real.
const server = await createServer({
  cacheDir: 'node_modules/.vite-tests/test-case-inputs',
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, ws: false },
  appType: 'custom',
});
const { default: TestCaseInputs } = await server.ssrLoadModule('/src/shared/components/TestCaseInputs.jsx');
const { getSubmissao } = await server.ssrLoadModule('/src/features/submissoes/api.js');
const { default: httpClient } = await server.ssrLoadModule('/src/shared/api/httpClient.js');
const originalAdapter = httpClient.defaults.adapter;
const originalLocalStorage = globalThis.localStorage;
globalThis.localStorage = { getItem: () => null };

after(async () => {
  httpClient.defaults.adapter = originalAdapter;
  if (originalLocalStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = originalLocalStorage;
  await server.close();
});

const submission = {
  uuid: 'tentativa-1', atividadeUuid: 'atividade-1', funcaoAtividadeUuid: 'snapshot-1',
  resultadosCasos: [{ casoTesteAtividadeUuid: 'caso-1', entradas: [0, false], retornoEsperado: false, retornoObtido: false, statusRetorno: 'DISPONIVEL' }],
};

test('renderiza entradas separadas, com nomes e valores falsy intactos', () => {
  const html = renderToStaticMarkup(createElement(TestCaseInputs, {
    entradas: [[5, 8, 2, 9], 0, false],
    parametros: [{ nome: 'valores', tipo: 'int[]' }, { nome: 'tamanho', tipo: 'int' }, { nome: 'ativo', tipo: 'bool' }],
  }));
  assert.equal((html.match(/<dt\b/g) || []).length, 3);
  for (const text of ['valores:', '[5,8,2,9]', 'tamanho:', '>0</dd>', 'ativo:', '>false</dd>']) assert.ok(html.includes(text));
});

test('inconsistências são exibidas sem atribuir um valor ao parâmetro errado', () => {
  const html = renderToStaticMarkup(createElement(TestCaseInputs, {
    entradas: [1], parametros: [{ nome: 'a', tipo: 'int' }, { nome: 'b', tipo: 'int' }],
  }));
  assert.ok(html.includes('Entradas incompatíveis'));
  assert.ok(!html.includes('<dt'));
});

test('detalhe recebe a assinatura do snapshot junto com os resultados', async () => {
  const calls = [];
  const parametros = [{ nome: 'valor_original', tipo: 'int' }, { nome: 'ativo', tipo: 'bool' }];
  httpClient.defaults.adapter = async (config) => {
    calls.push(config.url);
    const data = { ...submission, parametros };
    return { data, status: 200, statusText: 'OK', headers: {}, config };
  };
  const result = await getSubmissao('tentativa-1', { includeParameters: true });
  assert.deepEqual(result.parametros, parametros);
  assert.deepEqual(result.resultadosCasos, submission.resultadosCasos);
  assert.equal(result.resultadosCasos[0].retornoObtido, false);
  assert.equal(result.resultadosCasos[0].statusRetorno, 'DISPONIVEL');
  assert.deepEqual(calls, ['/api/submissoes/tentativa-1']);
});

test('não busca funções quando os resultados estão ocultos ou a assinatura não foi solicitada', async () => {
  const calls = [];
  httpClient.defaults.adapter = async (config) => {
    calls.push(config.url);
    return { data: { ...submission, resultadosCasos: undefined }, status: 200, headers: {}, config };
  };
  await getSubmissao('tentativa-1', { includeParameters: true });
  await getSubmissao('tentativa-1');
  assert.deepEqual(calls, ['/api/submissoes/tentativa-1', '/api/submissoes/tentativa-1']);
});

test('detalhe legado sem assinatura preserva os resultados e mostra aviso nas entradas', async () => {
  httpClient.defaults.adapter = async (config) => {
    return { data: submission, status: 200, headers: {}, config };
  };
  const result = await getSubmissao('tentativa-1', { includeParameters: true });
  assert.equal(result.uuid, submission.uuid);
  assert.equal(result.parametros, undefined);
  const html = renderToStaticMarkup(createElement(TestCaseInputs, { entradas: [0, false], parametros: result.parametros }));
  assert.ok(html.includes('Não foi possível carregar os nomes dos parâmetros.'));
  assert.ok(html.includes('[0,false]'));
});

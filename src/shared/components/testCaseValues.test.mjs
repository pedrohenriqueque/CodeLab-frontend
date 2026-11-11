import test from 'node:test';
import assert from 'node:assert/strict';
import {
  describeTestCaseInputs,
  formatCapturedReturn,
  formatTestCaseValue,
  parseTestCaseValue,
  formatCParameterSignature,
  getTypeName,
  getParamInputProps,
} from './testCaseValues.js';

test('associa cada valor à ordem da assinatura sem achatar vetores', () => {
  const parametros = [
    { nome: 'valores', tipo: 'int[]' },
    { nome: 'tamanho', tipo: 'int' },
    { nome: 'alvo', tipo: 'int' },
  ];
  const entradas = [[5, 8, 2, 9], 4, 8];
  const { rows, error } = describeTestCaseInputs(entradas, parametros);
  assert.equal(error, null);
  assert.deepEqual(rows.map(({ nome, valor }) => [nome, valor]), [
    ['valores', [5, 8, 2, 9]], ['tamanho', 4], ['alvo', 8],
  ]);
  assert.deepEqual(entradas, [[5, 8, 2, 9], 4, 8]);
});

test('usa os nomes da assinatura fornecida, incluindo nomes valor e retorno', () => {
  const snapshot = [{ nome: 'retorno', tipo: 'int' }, { nome: 'valor', tipo: 'bool' }];
  assert.deepEqual(describeTestCaseInputs([0, false], snapshot).rows.map(({ nome, valor }) => [nome, valor]), [
    ['retorno', 0], ['valor', false],
  ]);
});

test('não adivinha nomes quando falta a assinatura ou há quantidades diferentes', () => {
  for (const parametros of [undefined, [], [{ nome: 'a', tipo: 'int' }, { nome: 'b', tipo: 'int' }]]) {
    const result = describeTestCaseInputs([1], parametros);
    assert.ok(result.error);
    assert.deepEqual(result.rows, []);
  }
  assert.ok(describeTestCaseInputs({ a: 1 }, [{ nome: 'a', tipo: 'int' }]).error);
});

test('representa função sem parâmetros e valores sem perder zeros, booleanos ou strings', () => {
  assert.deepEqual(describeTestCaseInputs([], []), { rows: [], error: null });
  assert.equal(formatTestCaseValue(0), '0');
  assert.equal(formatTestCaseValue(false), 'false');
  assert.equal(formatTestCaseValue(''), '""');
  assert.equal(formatTestCaseValue('a\nb'), '"a\\nb"');
  assert.equal(formatTestCaseValue([1, 4, 2]), '[1,4,2]');
  assert.equal(formatTestCaseValue(undefined), '—');
});

test('converte campos em valores JSON mantendo o payload posicional', () => {
  const tipos = ['int[]', 'int', 'bool', 'string', 'char', 'double', 'long'];
  const campos = ['[5, 8, 2, 9]', '0', 'false', '', 'x', '2.5', '123'];
  assert.deepEqual(campos.map((value, index) => parseTestCaseValue(value, tipos[index])), [
    [5, 8, 2, 9], 0, false, '', 'x', 2.5, 123,
  ]);
  assert.deepEqual(parseTestCaseValue('[true,false]', 'bool[]'), [true, false]);
  assert.deepEqual(parseTestCaseValue('["a","b"]', 'char[]'), ['a', 'b']);
  assert.deepEqual(parseTestCaseValue('[]', 'int[]'), []);
  assert.equal(parseTestCaseValue('true', 'bool'), true);
  // Suporte a texto comum e vetores separados por vírgula
  assert.equal(parseTestCaseValue('radar', 'string'), 'radar');
  assert.equal(parseTestCaseValue("'a'", 'char'), 'a');
  assert.deepEqual(parseTestCaseValue('10, 20, 30', 'int[]'), [10, 20, 30]);
  assert.deepEqual(parseTestCaseValue('a, b, c', 'char[]'), ['a', 'b', 'c']);
  assert.deepEqual(parseTestCaseValue("'r', 'a', 'd'", 'char[]'), ['r', 'a', 'd']);
  assert.deepEqual(parseTestCaseValue('1.5, 2.5, 3.14', 'float[]'), [1.5, 2.5, 3.14]);
});

test('rejeita conversões parciais e elementos incompatíveis com o tipo', () => {
  for (const [value, tipo] of [
    ['', 'int'], ['2abc', 'int'], ['2.5', 'int'], ['Infinity', 'double'],
    ['yes', 'bool'], ['ab', 'char'], ['1, abc, 3', 'int[]'], ['{}', 'int[]'],
    ['["1",2]', 'int[]'], ['[true,2]', 'int[]'], ['[1,0]', 'bool[]'],
    ['a, bc, c', 'char[]'], ['', 'int[]'],
  ]) {
    assert.throws(() => parseTestCaseValue(value, tipo));
  }
});

test('mostra o retorno capturado sem substituir zero, false, string vazia ou null', () => {
  for (const value of [0, false, '', null, 'texto\n"com aspas"']) {
    assert.equal(formatCapturedReturn({ statusRetorno: 'DISPONIVEL', retornoObtido: value }), JSON.stringify(value));
  }
});

test('não inventa retorno para casos antigos, não executados ou com erro', () => {
  assert.equal(formatCapturedReturn({ aprovado: true, retornoEsperado: 10 }), 'Não informado');
  assert.equal(formatCapturedReturn({ aprovado: false, retornoEsperado: 10 }), 'Não informado');
  assert.equal(formatCapturedReturn({ statusRetorno: 'DISPONIVEL' }), 'Não informado');
  assert.equal(formatCapturedReturn({ statusRetorno: 'NAO_EXECUTADO' }), 'Não executado');
  assert.equal(formatCapturedReturn({ statusRetorno: 'ERRO_EXECUCAO' }), 'Erro durante a execução');
  assert.equal(formatCapturedReturn({ statusRetorno: 'LIMITE_EXCEDIDO' }), 'Retorno acima do limite de exibição');
});

test('formata assinatura de parâmetros C e props de inputs amigáveis', () => {
  // Ambas as opções geram char nome[] no protótipo de C do aluno
  assert.equal(formatCParameterSignature('str', 'string'), 'char str[]');
  assert.equal(formatCParameterSignature('str', 'char[]'), 'char str[]');
  assert.equal(formatCParameterSignature('valores', 'int[]'), 'int valores[]');
  assert.equal(formatCParameterSignature('n', 'int'), 'int n');
  assert.equal(formatCParameterSignature('c', 'char'), 'char c');

  assert.equal(getTypeName('string'), 'Texto (char[])');
  assert.equal(getTypeName('char[]'), 'Vetor de Caracteres (char[])');

  assert.equal(getParamInputProps('char').maxLength, 1);
  assert.equal(getParamInputProps('string').placeholder, 'ex: radar');
  assert.equal(getParamInputProps('char[]').placeholder, 'ex: a, b, c');
  assert.equal(getParamInputProps('int[]').placeholder, 'ex: 10, 20, 30');
});

export function formatTestCaseValue(value) {
  return value === undefined ? '—' : JSON.stringify(value);
}

export function formatCapturedReturn(result) {
  if (result?.statusRetorno === 'DISPONIVEL' && result.retornoObtido !== undefined) {
    return formatTestCaseValue(result.retornoObtido);
  }
  const messages = {
    NAO_EXECUTADO: 'Não executado',
    ERRO_EXECUCAO: 'Erro durante a execução',
    LIMITE_EXCEDIDO: 'Retorno acima do limite de exibição',
  };
  return messages[result?.statusRetorno] || 'Não informado';
}

export function describeTestCaseInputs(entradas, parametros) {
  if (!Array.isArray(parametros)) {
    return { rows: [], error: 'Não foi possível carregar os nomes dos parâmetros.' };
  }
  if (!Array.isArray(entradas) || entradas.length !== parametros.length) {
    return { rows: [], error: 'Entradas incompatíveis com a assinatura da função.' };
  }
  return {
    rows: parametros.map((parametro, index) => ({ ...parametro, valor: entradas[index] })),
    error: null,
  };
}

function matchesType(value, tipo) {
  if (tipo === 'int' || tipo === 'long') return Number.isInteger(value);
  if (tipo === 'float' || tipo === 'double') return typeof value === 'number' && Number.isFinite(value);
  if (tipo === 'bool') return typeof value === 'boolean';
  if (tipo === 'char') return typeof value === 'string' && value.length === 1;
  if (tipo === 'string') return typeof value === 'string';
  return false;
}

// Apenas converte os campos do formulário; a validação definitiva continua na API.
export function parseTestCaseValue(raw, tipo) {
  const text = String(raw ?? '');
  if (tipo.endsWith('[]')) {
    let value;
    try {
      value = JSON.parse(text);
    } catch {
      throw new Error('Informe um vetor em JSON, por exemplo [1, 2, 3].');
    }
    if (!Array.isArray(value) || !value.every((item) => matchesType(item, tipo.slice(0, -2)))) {
      throw new Error(`Informe um vetor com elementos do tipo ${tipo.slice(0, -2)}.`);
    }
    return value;
  }
  if (tipo === 'bool') {
    if (text === 'true') return true;
    if (text === 'false') return false;
    throw new Error('Informe true ou false.');
  }
  if (['int', 'long', 'float', 'double'].includes(tipo)) {
    const value = Number(text);
    if (!text.trim() || !matchesType(value, tipo)) throw new Error(`Informe um número válido do tipo ${tipo}.`);
    return value;
  }
  if (!matchesType(text, tipo)) throw new Error(`Informe um valor válido do tipo ${tipo}.`);
  return text;
}

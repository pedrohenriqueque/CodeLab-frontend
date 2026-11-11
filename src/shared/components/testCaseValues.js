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

export function matchesType(value, tipo) {
  if (tipo === 'int' || tipo === 'long') return Number.isInteger(value);
  if (tipo === 'float' || tipo === 'double') return typeof value === 'number' && Number.isFinite(value);
  if (tipo === 'bool') return typeof value === 'boolean';
  if (tipo === 'char') return typeof value === 'string' && value.length === 1;
  if (tipo === 'string') return typeof value === 'string';
  return false;
}

export function formatCParameterSignature(nome, tipo) {
  const cleanName = (nome || 'param').trim();
  const cleanType = tipo || 'int';
  if (cleanType === 'string') return `char ${cleanName}[]`;
  if (cleanType.endsWith('[]')) return `${cleanType.slice(0, -2)} ${cleanName}[]`;
  return `${cleanType} ${cleanName}`;
}

export function getTypeName(tipo) {
  if (tipo === 'string') return 'Texto (char[])';
  if (tipo === 'char[]') return 'Vetor de Caracteres (char[])';
  return tipo;
}

export function getParamInputProps(tipo) {
  if (tipo === 'string') {
    return {
      placeholder: 'ex: radar',
      helperText: 'Texto comum (ex: radar)',
      maxLength: undefined,
    };
  }
  if (tipo === 'char') {
    return {
      placeholder: 'ex: a',
      helperText: undefined,
      maxLength: 1,
    };
  }
  if (tipo === 'char[]') {
    return {
      placeholder: 'ex: a, b, c',
      helperText: 'Caracteres separados por vírgula (ex: a, b, c)',
      maxLength: undefined,
    };
  }
  if (tipo === 'int[]' || tipo === 'long[]') {
    return {
      placeholder: 'ex: 10, 20, 30',
      helperText: undefined,
      maxLength: undefined,
    };
  }
  if (tipo === 'float[]' || tipo === 'double[]') {
    return {
      placeholder: 'ex: 1.5, 2.0, 3.14',
      helperText: undefined,
      maxLength: undefined,
    };
  }
  if (tipo === 'bool') {
    return {
      placeholder: 'true ou false',
      helperText: undefined,
      maxLength: undefined,
    };
  }
  if (['float', 'double'].includes(tipo)) {
    return {
      placeholder: 'ex: 3.14',
      helperText: undefined,
      maxLength: undefined,
    };
  }
  return {
    placeholder: 'ex: 42',
    helperText: undefined,
    maxLength: undefined,
  };
}

function unwrapQuotes(str) {
  const trimmed = str.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

// Converte os campos do formulário para o formato JSON esperado pelo backend.
export function parseTestCaseValue(raw, tipo) {
  const text = String(raw ?? '');
  const trimmed = text.trim();

  if (tipo.endsWith('[]')) {
    const baseType = tipo.slice(0, -2);

    if (trimmed === '[]') {
      return [];
    }
    if (!trimmed) {
      throw new Error(`Informe os elementos do vetor.`);
    }

    // Se começa com [ e termina com ], verifica se é JSON nativo válido
    let items;
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          if (!parsed.every((item) => matchesType(item, baseType))) {
            throw new Error(`Informe um vetor com elementos do tipo ${baseType}.`);
          }
          return parsed;
        }
      } catch (err) {
        if (err.message.startsWith('Informe um vetor')) throw err;
      }
      const inner = trimmed.slice(1, -1).trim();
      if (!inner) return [];
      items = inner.split(',');
    } else {
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        throw new Error('Informe um vetor com colchetes ou separado por vírgula.');
      }
      items = trimmed.split(',');
    }

    return items.map((rawItem) => {
      const itemTrimmed = rawItem.trim();
      if (!itemTrimmed) {
        throw new Error(`Elemento vazio no vetor.`);
      }

      if (baseType === 'char') {
        const charVal = unwrapQuotes(itemTrimmed);
        if (charVal.length !== 1) {
          throw new Error('Cada elemento do vetor de caracteres deve ter exatamente 1 caractere.');
        }
        return charVal;
      }

      if (baseType === 'bool') {
        if (itemTrimmed === 'true') return true;
        if (itemTrimmed === 'false') return false;
        throw new Error('Elementos do vetor booleano devem ser true ou false.');
      }

      if (['int', 'long'].includes(baseType)) {
        const num = Number(itemTrimmed);
        if (!Number.isInteger(num)) {
          throw new Error(`Elemento "${itemTrimmed}" não é um número inteiro válido.`);
        }
        return num;
      }

      if (['float', 'double'].includes(baseType)) {
        const num = Number(itemTrimmed);
        if (isNaN(num) || !Number.isFinite(num)) {
          throw new Error(`Elemento "${itemTrimmed}" não é um número decimal válido.`);
        }
        return num;
      }

      return itemTrimmed;
    });
  }

  if (tipo === 'bool') {
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    throw new Error('Informe true ou false.');
  }

  if (['int', 'long', 'float', 'double'].includes(tipo)) {
    const value = Number(trimmed);
    if (!trimmed || !matchesType(value, tipo)) throw new Error(`Informe um número válido do tipo ${tipo}.`);
    return value;
  }

  if (tipo === 'char') {
    const charVal = unwrapQuotes(trimmed);
    if (charVal.length !== 1) throw new Error('Informe exatamente 1 caractere para o tipo char.');
    return charVal;
  }

  if (tipo === 'string') {
    return text;
  }

  if (!matchesType(text, tipo)) throw new Error(`Informe um valor válido do tipo ${tipo}.`);
  return text;
}

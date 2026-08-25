/**
 * Auth Validation Helpers & Rules (DRY).
 *
 * Centraliza todas as regras de validação para Login e Registro de acordo com:
 * - Requisitos funcionais (Matrícula, E-mail institucional, Senha forte com maiúscula, caractere especial e 8+ chars).
 * - Heurísticas de Nielsen (Prevenção de erros, mensagens claras e construtivas, visibilidade do status do sistema).
 */

export const INSTITUTIONAL_DOMAINS = ['.edu.br', '.uf', '.usp.br', '.unicamp.br', '.ufrj.br', '.unesp.br', '.universidade.br', '.edu'];

/**
 * Validação de Nome Completo.
 */
export function validateNome(nome) {
  if (!nome || !nome.trim()) {
    return 'Informe seu nome completo.';
  }
  const parts = nome.trim().split(/\s+/);
  if (parts.length < 2) {
    return 'Por favor, informe seu nome e sobrenome.';
  }
  if (nome.trim().length < 3) {
    return 'O nome deve ter no mínimo 3 caracteres.';
  }
  return '';
}

/**
 * Validação de Matrícula.
 */
export function validateMatricula(matricula) {
  if (!matricula || !matricula.trim()) {
    return 'Informe o número da matrícula.';
  }
  const clean = matricula.trim();
  if (clean.length < 4 || clean.length > 20) {
    return 'A matrícula deve ter entre 4 e 20 dígitos/caracteres.';
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(clean)) {
    return 'A matrícula contém caracteres inválidos.';
  }
  return '';
}

/**
 * Validação de Email Institucional.
 */
export function validateEmail(email, { requireInstitutional = false } = {}) {
  if (!email || !email.trim()) {
    return 'Informe o seu endereço de e-mail.';
  }
  const clean = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clean)) {
    return 'Informe um formato de e-mail válido (ex: seu@universidade.edu.br).';
  }

  if (requireInstitutional) {
    const isInstitutional = INSTITUTIONAL_DOMAINS.some(domain => clean.endsWith(domain)) || clean.includes('.edu');
    if (!isInstitutional) {
      return 'Utilize seu e-mail institucional (ex: nome@universidade.edu.br).';
    }
  }

  return '';
}

/**
 * Regras de complexidade da senha.
 */
export function checkPasswordStrength(senha) {
  const hasMinLength = (senha || '').length >= 8;
  const hasUppercase = /[A-Z]/.test(senha || '');
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/`~]/.test(senha || '');
  const hasNumber = /[0-9]/.test(senha || '');

  const score = [hasMinLength, hasUppercase, hasSpecialChar, hasNumber].filter(Boolean).length;

  return {
    hasMinLength,
    hasUppercase,
    hasSpecialChar,
    hasNumber,
    isValid: hasMinLength && hasUppercase && hasSpecialChar,
    score, // 0 a 4
  };
}

/**
 * Validação do campo de senha no cadastro.
 */
export function validateSenhaCadastro(senha) {
  if (!senha) {
    return 'A senha é obrigatória.';
  }
  const strength = checkPasswordStrength(senha);
  if (!strength.hasMinLength) {
    return 'A senha deve conter no mínimo 8 caracteres.';
  }
  if (!strength.hasUppercase) {
    return 'A senha deve conter pelo menos uma letra maiúscula.';
  }
  if (!strength.hasSpecialChar) {
    return 'A senha deve conter pelo menos um caractere especial (!@#$%...).';
  }
  return '';
}

/**
 * Validação de confirmação de senha.
 */
export function validateConfirmarSenha(senha, confirmarSenha) {
  if (!confirmarSenha) {
    return 'Confirme sua senha.';
  }
  if (senha !== confirmarSenha) {
    return 'As senhas não coincidem. Verifique e tente novamente.';
  }
  return '';
}

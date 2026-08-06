const PATIENT_PORTAL_LOGIN_REGEX = /^[a-z0-9._-]{4,32}$/;

export function normalizePatientPortalLogin(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidPatientPortalLogin(value: string): boolean {
  return PATIENT_PORTAL_LOGIN_REGEX.test(normalizePatientPortalLogin(value));
}

export function buildPatientPortalAuthEmail(login: string): string {
  return `patient+${normalizePatientPortalLogin(login)}@portal.local`;
}

export function validatePatientPortalPassword(password: string): string | null {
  if (password.length < 8) {
    return "A senha precisa ter pelo menos 8 caracteres.";
  }

  if (!/[A-Z]/.test(password)) {
    return "A senha precisa ter ao menos uma letra maiuscula.";
  }

  if (!/[a-z]/.test(password)) {
    return "A senha precisa ter ao menos uma letra minuscula.";
  }

  if (!/[0-9]/.test(password)) {
    return "A senha precisa ter ao menos um numero.";
  }

  return null;
}

export const validatePassword = (password: string): { valid: boolean; reason?: string } => {
  if (!password || password.length <= 8) {
    return { valid: false, reason: 'Password must be longer than 8 characters.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one special character.' };
  }
  return { valid: true };
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

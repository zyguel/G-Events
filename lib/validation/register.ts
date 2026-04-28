const EMAIL_PATTERN = /^[^\s+@]+@[^\s@]+\.[^\s@]+$/;
const ALPHANUMERIC_NAME_PATTERN = /^[A-Za-z0-9 ]+$/;

export const REGISTER_LIMITS = {
  FULL_NAME_MIN: 3,
  FULL_NAME_MAX: 80,
  EMAIL_MIN: 6,
  EMAIL_MAX: 254,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 64,
} as const;

export interface RegisterValidationInput {
  fullName: string;
  email: string;
  password: string;
}

export function normalizeRegisterInput(input: RegisterValidationInput): RegisterValidationInput {
  return {
    fullName: input.fullName.trim().replace(/\s+/g, ' '),
    email: input.email.trim().toLowerCase(),
    password: input.password,
  };
}

export function validateRegisterInput(input: RegisterValidationInput): string | null {
  const normalized = normalizeRegisterInput(input);

  if (normalized.fullName.length < REGISTER_LIMITS.FULL_NAME_MIN) {
    return `Full name must be at least ${REGISTER_LIMITS.FULL_NAME_MIN} characters.`;
  }

  if (normalized.fullName.length > REGISTER_LIMITS.FULL_NAME_MAX) {
    return `Full name must be at most ${REGISTER_LIMITS.FULL_NAME_MAX} characters.`;
  }

  if (!ALPHANUMERIC_NAME_PATTERN.test(normalized.fullName)) {
    return 'Full name may only contain letters, numbers, and spaces.';
  }

  if (normalized.email.length < REGISTER_LIMITS.EMAIL_MIN || normalized.email.length > REGISTER_LIMITS.EMAIL_MAX) {
    return `Email must be between ${REGISTER_LIMITS.EMAIL_MIN} and ${REGISTER_LIMITS.EMAIL_MAX} characters.`;
  }

  if (!EMAIL_PATTERN.test(normalized.email)) {
    return 'Please provide a valid email address.';
  }

  if (normalized.password.length < REGISTER_LIMITS.PASSWORD_MIN) {
    return `Password must be at least ${REGISTER_LIMITS.PASSWORD_MIN} characters.`;
  }

  if (normalized.password.length > REGISTER_LIMITS.PASSWORD_MAX) {
    return `Password must be at most ${REGISTER_LIMITS.PASSWORD_MAX} characters.`;
  }

  return null;
}

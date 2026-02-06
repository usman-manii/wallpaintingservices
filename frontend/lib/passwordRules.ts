export type PasswordRule = {
  id: string;
  label: string;
  satisfied: boolean;
};

type RuleDefinition = {
  id: string;
  label: string;
  test: (value: string) => boolean;
};

const RULES: RuleDefinition[] = [
  {
    id: 'length',
    label: 'At least 12 characters',
    test: (value) => value.length >= 12,
  },
  {
    id: 'lowercase',
    label: 'Contains a lowercase letter',
    test: (value) => /[a-z]/.test(value),
  },
  {
    id: 'uppercase',
    label: 'Contains an uppercase letter',
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: 'number',
    label: 'Contains a number',
    test: (value) => /\d/.test(value),
  },
  {
    id: 'special',
    label: 'Contains a special character',
    test: (value) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(value),
  },
];

export const getPasswordRules = (value: string): PasswordRule[] => (
  RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    satisfied: rule.test(value),
  }))
);

export const isPasswordValid = (value: string): boolean => (
  RULES.every((rule) => rule.test(value))
);

export const getPasswordValidationMessage = (value: string): string | null => {
  if (!RULES[0].test(value)) {
    return 'Password must be at least 12 characters long.';
  }
  if (!RULES[1].test(value) || !RULES[2].test(value) || !RULES[3].test(value)) {
    return 'Password must include uppercase, lowercase, and a number.';
  }
  if (!RULES[4].test(value)) {
    return 'Password must include at least one special character.';
  }
  return null;
};

export const getPasswordStrength = (value: string) => {
  const satisfied = getPasswordRules(value).filter((rule) => rule.satisfied).length;
  const score = Math.round((satisfied / RULES.length) * 100);
  if (score >= 90) return { score, label: 'Strong' };
  if (score >= 60) return { score, label: 'Good' };
  if (score >= 30) return { score, label: 'Weak' };
  return { score, label: 'Very weak' };
};

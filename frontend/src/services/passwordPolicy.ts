// Mirrors backend/CMS.Api/Services/PasswordPolicy.cs — keep them in sync.

export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const SPECIAL_CHARACTERS = "!@#$%^&*()_+-=[]{};:'\",.<>/?\\|`~";

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (p) => p.length >= 8,
  },
  {
    id: "upper",
    label: "One uppercase letter (A–Z)",
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: "lower",
    label: "One lowercase letter (a–z)",
    test: (p) => /[a-z]/.test(p),
  },
  {
    id: "digit",
    label: "One digit (0–9)",
    test: (p) => /\d/.test(p),
  },
  {
    id: "special",
    label: "One special character",
    test: (p) =>
      Array.from(p).some((c) => SPECIAL_CHARACTERS.includes(c)),
  },
];

export interface PasswordRuleResult extends PasswordRule {
  passed: boolean;
}

export function checkPassword(password: string): PasswordRuleResult[] {
  return PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(password),
  }));
}

export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every((r) => r.test(password));
}

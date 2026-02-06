'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { getPasswordRules, getPasswordStrength } from '@/lib/passwordRules';

export default function PasswordRules({ password, showWhenEmpty = false }: { password: string; showWhenEmpty?: boolean }) {
  if (!showWhenEmpty && password.length === 0) return null;

  const rules = getPasswordRules(password);
  const strength = getPasswordStrength(password);

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-foreground">Password strength</span>
        <span className="text-muted-foreground">{strength.label}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${strength.score}%` }}
        />
      </div>
      <ul className="mt-3 space-y-1">
        {rules.map((rule) => (
          <li key={rule.id} className="flex items-center gap-2">
            {rule.satisfied ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className={rule.satisfied ? 'text-foreground' : 'text-muted-foreground'}>
              {rule.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

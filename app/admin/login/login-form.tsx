"use client";

import { ActionForm, FieldError, SubmitButton, useFieldError } from "@/components/admin/client";
import { field } from "@/components/admin/ui";
import { login } from "./actions";

function Input({ name, label, type, autoComplete }: { name: string; label: string; type: string; autoComplete: string }) {
  const error = useFieldError(name);
  return (
    <div>
      <label htmlFor={name} className={field.label}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        aria-invalid={error ? true : undefined}
        className={field.input}
      />
      <FieldError name={name} />
    </div>
  );
}

export function LoginForm({ next }: { next: string }) {
  return (
    <ActionForm action={login} className="mt-6 grid gap-4" showSuccess={false}>
      <input type="hidden" name="next" value={next} />
      <Input name="email" label="Email" type="email" autoComplete="username" />
      <Input name="password" label="Password" type="password" autoComplete="current-password" />
      <SubmitButton className="mt-1 w-full" pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
    </ActionForm>
  );
}

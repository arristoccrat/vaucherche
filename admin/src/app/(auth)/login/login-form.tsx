"use client";

import { useFormState, useFormStatus } from "react-dom";

import { sendMagicLink, type MagicLinkState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Изпращане…" : "Изпрати линк за вход"}
    </Button>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useFormState<MagicLinkState, FormData>(
    sendMagicLink,
    null
  );

  if (state?.ok) {
    return (
      <p className="text-sm text-muted-foreground">
        Изпратихме линк за вход на{" "}
        <span className="font-medium text-foreground">{state.data.email}</span>.
        Отворете го в този браузър.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <div className="space-y-2">
        <Label htmlFor="email">Имейл</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
        />
      </div>
      {state && !state.ok ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <SubmitButton />
    </form>
  );
}

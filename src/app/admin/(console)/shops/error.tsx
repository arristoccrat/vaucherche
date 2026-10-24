"use client";

import { Button } from "@/components/ui/button";

export default function ShopsError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-destructive/40 p-6">
      <h2 className="font-semibold">Грешка при зареждане на магазините</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <Button variant="outline" size="sm" onClick={reset}>
        Опитай пак
      </Button>
    </div>
  );
}

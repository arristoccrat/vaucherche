// Rendered on the server so the real database message reaches the page
// (Next.js hides thrown server errors in production).
export function QueryError({ message }: { message: string }) {
  const missingMigration = /description|gift_appeal_rank/.test(message);
  return (
    <div className="space-y-2 rounded-lg border border-destructive/40 p-6">
      <h2 className="font-semibold">Грешка при четене от базата</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
      {missingMigration ? (
        <p className="text-sm">
          Липсват колони от фаза 5 — пуснете <code>admin/sql/001_editorial.sql</code> в
          Supabase SQL Editor.
        </p>
      ) : null}
    </div>
  );
}

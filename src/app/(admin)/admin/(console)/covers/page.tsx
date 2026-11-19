import { getCoverLibrary } from "@/lib/queries/covers";

import { CoverLibrary } from "./_components/cover-library";

// Covers uploaded once, with a name, and picked for any shop from a list on
// its cover (sql/017).
export default async function CoversPage() {
  const { covers, missingTable } = await getCoverLibrary();
  const active = covers.filter((c) => !c.archivedAt);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Корици</h1>
        <p className="text-sm text-muted-foreground">
          Качи корица веднъж, дай ѝ име и после я избирай за всеки магазин от списъка „От библиотеката“ под корицата.
          {active.length ? ` ${active.length} в библиотеката.` : ""}
        </p>
      </div>
      {missingTable ? (
        <p className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
          Таблицата с корици още не съществува. Пусни <code>sql/017_cover_library.sql</code> в Supabase SQL Editor.
        </p>
      ) : (
        <CoverLibrary covers={covers} />
      )}
    </div>
  );
}

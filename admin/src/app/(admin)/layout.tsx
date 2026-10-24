import Link from "next/link";
import { Toaster } from "sonner";

import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";

// Admin pages depend on the session; never render them at build time.
export const dynamic = "force-dynamic";

const NAV = [
  { href: "/shops", label: "Магазини" },
  { href: "/queue", label: "Опашка" },
  { href: "/ops", label: "Операции" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
          <Link href="/shops" className="font-semibold">
            Vaucherche Admin
          </Link>
          <nav className="flex gap-4 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-muted-foreground sm:inline">
              {user.email}
            </span>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                Изход
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      <Toaster richColors position="bottom-right" />
    </div>
  );
}

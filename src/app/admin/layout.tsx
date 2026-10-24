import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Vaucherche Admin", template: "%s · Vaucherche Admin" },
  robots: { index: false, follow: false },
};

// Everything under /admin gets the admin theme (see .admin-root in
// globals.css) regardless of the public site's light/dark mode.
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-root min-h-screen bg-background text-foreground antialiased">
      {children}
    </div>
  );
}

// Production keeps showing the coming soon page until SITE_LAUNCHED=true is
// set in Vercel. Preview deployments and `next dev` always show the real
// site so it can be built and reviewed before launch.
export function isSiteLaunched() {
  return (
    process.env.SITE_LAUNCHED === "true" ||
    process.env.VERCEL_ENV === "preview" ||
    process.env.NODE_ENV === "development"
  );
}

export const SITE_NAME = "vaucherche.bg";

// Shown in the footer once set. TODO: the public contact address.
export const CONTACT_EMAIL: string | null = null;

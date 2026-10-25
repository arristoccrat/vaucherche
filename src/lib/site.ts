// Production shows /coming-soon to everyone until SITE_LAUNCHED=true is set
// in Vercel. Preview deployments and `next dev` always show the real site.
// Before launch, the real site can also be previewed on production by
// opening /?preview=<PREVIEW_TOKEN> once (sets a cookie; /?preview=off
// clears it). See src/middleware.ts.
export function isSiteLaunched() {
  return (
    process.env.SITE_LAUNCHED === "true" ||
    process.env.VERCEL_ENV === "preview" ||
    process.env.NODE_ENV === "development"
  );
}

export const PREVIEW_COOKIE = "vc_preview";
export const COMING_SOON_PATH = "/coming-soon";

export const SITE_NAME = "vaucherche.bg";

// Shown in the footer once set. TODO: the public contact address.
export const CONTACT_EMAIL: string | null = null;

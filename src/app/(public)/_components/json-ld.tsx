import { SITE_URL } from "@/lib/site";

const absolute = (path: string) => new URL(path, SITE_URL).toString();

// One schema.org block. `<` is escaped so data in a name cannot close the
// script tag.
function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\\u003c") }}
    />
  );
}

// schema.org BreadcrumbList for the visible breadcrumb.
export function BreadcrumbJsonLd({ items }: { items: { name: string; path: string }[] }) {
  return (
    <JsonLd
      data={{
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: absolute(item.path) })),
      }}
    />
  );
}

// The home page: the site itself (with its search, which Google may offer
// as a box under the result) and who runs it.
export function SiteJsonLd() {
  return (
    <>
      <JsonLd
        data={{
          "@type": "WebSite",
          name: "vaucherche",
          url: absolute("/"),
          inLanguage: "bg",
          potentialAction: {
            "@type": "SearchAction",
            target: { "@type": "EntryPoint", urlTemplate: `${absolute("/tarsene")}?q={search_term_string}` },
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <JsonLd data={{ "@type": "Organization", name: "vaucherche", url: absolute("/"), logo: absolute("/apple-icon.png") }} />
    </>
  );
}

// The shops a list page shows, in order, so the page reads as a list of
// shop pages.
export function ShopListJsonLd({ shops, offset }: { shops: { slug: string | null; name: string | null; domain: string | null }[]; offset: number }) {
  const items = shops.filter((s) => s.slug);
  if (!items.length) return null;
  return (
    <JsonLd
      data={{
        "@type": "ItemList",
        itemListElement: items.map((s, i) => ({
          "@type": "ListItem",
          position: offset + i + 1,
          url: absolute(`/magazin/${s.slug}`),
          name: s.name?.trim() || s.domain || undefined,
        })),
      }}
    />
  );
}

// A shop page: its gift voucher as a product with its price range in euros.
// Left out when the shop lists no amounts (an offer needs a price).
export function VoucherJsonLd({
  name,
  slug,
  description,
  image,
  low,
  high,
}: {
  name: string;
  slug: string;
  description: string;
  image: string | null;
  low: number | null;
  high: number | null;
}) {
  if (low == null || high == null) return null;
  const url = absolute(`/magazin/${slug}`);
  return (
    <JsonLd
      data={{
        "@type": "Product",
        name: `Подаръчен ваучер ${name}`,
        brand: { "@type": "Brand", name },
        description,
        url,
        ...(image ? { image } : {}),
        offers:
          low === high
            ? { "@type": "Offer", price: low.toFixed(2), priceCurrency: "EUR", url, availability: "https://schema.org/InStock" }
            : {
                "@type": "AggregateOffer",
                lowPrice: low.toFixed(2),
                highPrice: high.toFixed(2),
                priceCurrency: "EUR",
                url,
                availability: "https://schema.org/InStock",
              },
      }}
    />
  );
}

// A category page's questions and answers (sql/018), as shown on the page.
export function FaqJsonLd({ items }: { items: { q: string; a: string }[] }) {
  if (!items.length) return null;
  return (
    <JsonLd
      data={{
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      }}
    />
  );
}

import { describe, expect, it } from "vitest";

import { suggestFromCrawl } from "@/lib/suggestions";

describe("suggestFromCrawl", () => {
  it("reads flat Open Graph tags and ranks repeated values first", () => {
    const s = suggestFromCrawl("helikon.bg", [
      { url: "https://helikon.bg/v/50", meta: { "og:site_name": "Хеликон", "og:image": "/img/v50.jpg" } },
      { url: "https://helikon.bg/v/100", meta: { "og:site_name": "Хеликон", "og:image": "https://cdn.helikon.bg/v100.jpg" } },
      { url: "https://helikon.bg/v/20", meta: { "og:site_name": "Helikon Books" } },
    ]);
    expect(s.names.map((n) => n.value)).toEqual(["Хеликон", "Helikon Books"]);
    expect(s.names[0].count).toBe(2);
    expect(s.covers.map((c) => c.value)).toContain("https://helikon.bg/img/v50.jpg");
  });

  it("reads JSON-LD organisations (name + logo) and product images", () => {
    const s = suggestFromCrawl("shop.bg", [
      {
        url: "https://shop.bg/gift",
        meta: {
          jsonld: [
            { "@type": "Organization", name: "Магазин ООД", logo: { "@type": "ImageObject", url: "/logo.png" } },
            { "@type": "Product", name: "Ваучер", image: ["https://shop.bg/p.jpg"] },
          ],
        },
      },
    ]);
    expect(s.names[0].value).toBe("Магазин ООД");
    expect(s.logos[0].value).toBe("https://shop.bg/logo.png");
    expect(s.covers[0].value).toBe("https://shop.bg/p.jpg");
  });

  it("reads {property, content} pairs, icon links, product image_url and AI extracts", () => {
    const s = suggestFromCrawl(
      "x.bg",
      [
        {
          url: "https://x.bg/a",
          image_url: "https://x.bg/cover.webp",
          meta: [{ property: "og:site_name", content: "Икс" }],
          links: [{ rel: "apple-touch-icon", href: "/apple.png" }, { rel: "canonical", href: "/a" }],
        },
      ],
      [{ shop_name: "Икс Шоп" }]
    );
    expect(s.names.map((n) => n.value)).toEqual(["Икс", "Икс Шоп"]);
    expect(s.logos.map((l) => l.value)).toEqual(["https://x.bg/apple.png"]);
    expect(s.covers.map((c) => c.value)).toEqual(["https://x.bg/cover.webp"]);
  });

  it("drops the domain as a name, bad URLs and non-http schemes", () => {
    const s = suggestFromCrawl("rumi.bg", [
      { url: "https://rumi.bg/", meta: { "og:site_name": "rumi.bg", "og:image": "javascript:alert(1)" } },
    ]);
    expect(s.names).toEqual([]);
    expect(s.covers).toEqual([]);
  });

  it("copes with empty or missing data", () => {
    expect(suggestFromCrawl("a.bg", [])).toEqual({ names: [], logos: [], covers: [] });
    expect(suggestFromCrawl("a.bg", [{ url: "not a url", meta: null, links: null }]).covers).toEqual([]);
  });
});

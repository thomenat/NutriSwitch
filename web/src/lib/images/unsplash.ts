import "server-only";

export type StockImageResult = {
  url: string;
  alt: string;
  credit: string;
  creditUrl: string;
};

type UnsplashSearchResult = {
  results?: Array<{
    urls?: { regular?: string };
    description?: string | null;
    alt_description?: string | null;
    user?: {
      name?: string | null;
      links?: { html?: string } | null;
    } | null;
  }>;
};

export async function resolveStockImage(query: string): Promise<StockImageResult | null> {
  const key = (process.env.UNSPLASH_ACCESS_KEY ?? "").trim();
  if (!key) return null;

  const trimmed = query.trim();
  if (!trimmed) return null;

  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(trimmed)}&per_page=1`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Client-ID ${key}` },
      next: { revalidate: 86400 },
    });
  } catch {
    return null;
  }

  if (!res.ok) return null;

  let data: UnsplashSearchResult;
  try {
    data = (await res.json()) as UnsplashSearchResult;
  } catch {
    return null;
  }

  const first = data.results?.[0];
  if (!first?.urls?.regular) return null;

  const credit = first.user?.name?.trim() ?? "Unknown";
  const creditHtml = first.user?.links?.html ?? "https://unsplash.com";
  const creditUrl = creditHtml.includes("?")
    ? `${creditHtml}&utm_source=nutriswitch&utm_medium=referral`
    : `${creditHtml}?utm_source=nutriswitch&utm_medium=referral`;

  return {
    url: first.urls.regular,
    alt: (first.description ?? first.alt_description ?? trimmed).slice(0, 200) || trimmed,
    credit,
    creditUrl,
  };
}

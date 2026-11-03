export interface ScrapedOGData {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url?: string;
}

export async function scrapeOG(text: string): Promise<ScrapedOGData | null> {
  try {
    const urlMatch = text.match(/https?:\/\/[^\s]+/i);
    if (!urlMatch) return null;

    let targetUrl = urlMatch[0];
    // Clean trailing punctuation if any
    targetUrl = targetUrl.replace(/[.,;!?)]+$/, "");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    // Read only first 60KB to keep it lightning fast
    const html = await response.text();
    const sample = html.slice(0, 65536);

    const getMeta = (prop: string) => {
      const match =
        sample.match(new RegExp(`<meta[^>]+(?:property|name)=["'](?:og:)?${prop}["'][^>]+content=["']([^"']+)["']`, "i")) ||
        sample.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:)?${prop}["']`, "i"));
      return match ? match[1] : undefined;
    };

    const titleMatch = sample.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = getMeta("title") || (titleMatch ? titleMatch[1].trim() : undefined);
    const description = getMeta("description");
    let image = getMeta("image");

    if (image && !image.startsWith("http")) {
      try {
        image = new URL(image, targetUrl).toString();
      } catch {
        // ignore invalid relative url
      }
    }

    const domain = new URL(targetUrl).hostname.replace(/^www\./, "");
    const siteName = getMeta("site_name") || domain;

    if (!title && !description && !image) {
      return null;
    }

    return {
      title,
      description: description ? description.slice(0, 200) : undefined,
      image,
      siteName,
      url: targetUrl,
    };
  } catch (error) {
    // If scraping fails or times out, fail gracefully
    return null;
  }
}


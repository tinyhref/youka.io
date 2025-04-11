import cheerio from "cheerio";
import got from "./got";
import { GoogleLyricsProvider } from "..";
import { match } from "./utils";
import Debug from "debug";
const debug = Debug("youka:desktop");

interface Cache {
  [key: string]: string | undefined;
}
interface SearchResult {
  title: string;
  url: string;
}
const cache: Cache = {};

export let providers: GoogleLyricsProvider[] = [];

export function register(provider: GoogleLyricsProvider) {
  providers.push(provider);
}

export async function search(
  name: string,
  query: string,
  lang: string
): Promise<string | undefined> {
  const key = `${name}::${query}`;
  if (key in cache) {
    return cache[key];
  }

  const sites: string[] = providers
    .filter((p) => p.supported(lang))
    .map((p) => p.site);

  const siteQuery = google_search_query(query, sites);
  const num = 30;
  const results = await google_search(siteQuery, num);

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    const result = results.find(
      (result) =>
        result.url.match(provider.site_re) &&
        (match(query, result.title) ||
          match(query, result.url) ||
          lang === "th")
    );
    const url = result ? result.url : undefined;
    const pkey = `${provider.name}::${query}`;
    cache[pkey] = url;
  }
  return cache[key];
}

export function google_search_query(query: string, sites: string[]) {
  return sites.map((site) => `site:${site}`).join(" OR ") + " " + query;
}

async function google_search(query: string, num: number) {
  query = encodeURIComponent(query);
  query = query.replace(/%20/g, "+");
  const url = `https://www.google.com/search?q=${query}&num=${num}`;
  debug("google search", url);
  let html;
  try {
    html = await got(url).text();
  } catch (e) {
    console.error(e);
    return [];
  }

  const $ = cheerio.load(html);
  const results: SearchResult[] = [];
  $(".g").each((i, el) => {
    const url = $(el).find("a").attr("href");
    if (!url) return;
    const title = $(el).find("h3").text();
    results.push({ url, title });
  });

  return results;
}

import { language } from "@/lib/google-translate";
import * as report from "@/lib/report";
import providers from "./providers";
import Debug from "debug";
const debug = Debug("youka:desktop");

export interface LyricsProvider {
  name: string;
  search(query: string, lang: string | undefined): Promise<string | undefined>;
  lyrics(url: string): Promise<string | undefined>;
  supported(lang: string): boolean;
}

export interface GoogleLyricsProvider extends LyricsProvider {
  site: string;
  site_re: RegExp;
}

export default async function search(
  query: string,
  lang?: string,
  signal?: AbortSignal
) {
  if (!query || query.trim() === "") return;

  if (!lang) {
    try {
      lang = await language(query);
      debug(lang);
    } catch (e) {
      report.error(e as any);
      debug(e);
    }
  }

  for (let i = 0; i < providers.length; i++) {
    if (signal?.aborted) throw new Error("aborted");
    const provider = providers[i];
    try {
      const url = await provider.search(query, lang);
      if (!url) continue;
      const lyrics = await provider.lyrics(url);
      if (!lyrics || lyrics.length < 50) {
        report.warn("failed to get lyrics", {
          provider: provider.name,
          query,
          url,
          lyrics,
        });
        continue;
      }
      debug(provider.name);
      debug(lyrics);
      return lyrics.trim();
    } catch (e) {
      report.error(e as Error, { provider: provider.name, query, lang });
    }
  }
}

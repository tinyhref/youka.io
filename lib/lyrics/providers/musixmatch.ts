import got from "./got";
import cheerio from "cheerio";
import * as google from "./google_site";
import { GoogleLyricsProvider } from "..";
// @ts-ignore
import safeEval from "safe-eval";

class Provider implements GoogleLyricsProvider {
  name = "musixmatch.com";
  site = "https://www.musixmatch.com/lyrics";
  site_re = /https:\/\/www\.musixmatch\.com\/lyrics\//;

  supported() {
    return true;
  }

  async search(query: string, lang: string) {
    return google.search(this.name, query, lang);
  }

  async lyrics(url: string) {
    const html = await got(url).text();
    const $ = cheerio.load(html);

    let script = $("script#__NEXT_DATA__").html();
    if (!script) return;

    const obj = safeEval(script);
    if (!obj) return;

    const trackStructureList =
      obj.props?.pageProps?.data?.trackInfo?.data?.trackStructureList;

    if (trackStructureList) {
      const lines: string[] = [];

      trackStructureList.forEach((trackStructure: any) => {
        trackStructure.lines.forEach((line: any) => {
          if (line.type !== "lyrics") return;
          lines.push(line.text);
        });
      });

      const lyrics = lines.join("\n").trim();
      return lyrics;
    }

    const lyricsBody =
      obj.props?.pageProps?.data?.trackInfo?.data?.lyrics?.body;
    if (lyricsBody) {
      const lyricsArr = lyricsBody.split("\n").map((line: string) => {
        return line.trim().replace(/(\.|,)$/, "");
      });
      const lyrics = lyricsArr.join("\n").trim();
      return lyrics;
    }
  }
}

const provider = new Provider();
google.register(provider);
export default provider;

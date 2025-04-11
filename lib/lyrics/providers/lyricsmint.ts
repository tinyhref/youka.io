import cheerio from "cheerio";
import got from "./got";
import * as google from "./google_site";
import { GoogleLyricsProvider } from "..";

class Provider implements GoogleLyricsProvider {
  name = "lyricsmint.com";
  site = "https://www.lyricsmint.com/";
  site_re = /https:\/\/www\.lyricsmint\.com\/.*\/.*/;

  supported(lang: string) {
    return ["hi", "pa"].includes(lang);
  }

  async search(query: string, lang: string) {
    return google.search(this.name, query, lang);
  }

  async lyrics(url: string) {
    const html = await got(url).text();
    const $ = cheerio.load(html);
    const ps: string[] = [];
    $("div.pt-4.pb-2 > .text-base > p").each((i, el) => {
      const p = $(el).text();
      ps.push(p);
    });
    const l = ps.join("\n\n");
    return l;
  }
}

const provider = new Provider();
google.register(provider);
export default provider;

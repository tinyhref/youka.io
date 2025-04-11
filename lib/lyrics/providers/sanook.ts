import cheerio from "cheerio";
import got from "./got";
import * as google from "./google_site";
import { GoogleLyricsProvider } from "..";

class Provider implements GoogleLyricsProvider {
  name = "sanook.com";
  site = "https://www.sanook.com/music/song";
  site_re = /https:\/\/www\.sanook\.com\/music\/song/;

  supported(lang: string) {
    return lang === "th";
  }

  async search(query: string, lang: string) {
    return google.search(this.name, query, lang);
  }

  async lyrics(url: string) {
    const html = await got(url).text();
    const $ = cheerio.load(html);
    const lines: string[] = [];
    $("div.jsx-3734992305 > p:not(.SourcedFrom)").each((i, el) => {
      const line = $(el).text();
      if ((i < 3 && line.includes(":")) || line.startsWith("***")) return;
      lines.push(line);
    });
    const l = lines.join("\n").trim();
    return l;
  }
}

const provider = new Provider();
google.register(provider);
export default provider;

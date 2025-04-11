import cheerio from "cheerio";
import got from "./got";
import * as google from "./google_site";
import { GoogleLyricsProvider } from "..";

class Provider implements GoogleLyricsProvider {
  name = "rus-songs.ru";
  site = "https://rus-songs.ru/";
  site_re = /https:\/\/rus-songs\.ru\/.*/;

  supported(lang: string) {
    return lang === "ru";
  }

  async search(query: string, lang: string) {
    return google.search(this.name, query, lang);
  }

  async lyrics(url: string) {
    const html = await got(url).text();
    const $ = cheerio.load(html);
    const lines: string[] = [];
    $(".post-content > p").each((i, el) => {
      const line = $(el).html()?.split("<br>");
      if (line) {
        lines.push(...line);
      }
    });

    const text = lines.join("\n").trim();

    return text;
  }
}

const provider = new Provider();
google.register(provider);
export default provider;

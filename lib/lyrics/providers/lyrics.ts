import cheerio from "cheerio";
import got from "./got";
import * as google from "./google_site";
import { GoogleLyricsProvider } from "..";

class Provider implements GoogleLyricsProvider {
  name = "lyrics.com";
  site = "https://www.lyrics.com/lyric";
  site_re = /https:\/\/www\.lyrics\.com\/lyric\/(\d+)\/.*\/.*/;

  supported(lang: string) {
    return lang === "en";
  }

  async search(query: string, lang: string) {
    return google.search(this.name, query, lang);
  }

  async lyrics(url: string) {
    const html = await got(url).text();
    const $ = cheerio.load(html);
    const l = $("#lyric-body-text").text().trim();
    return l;
  }
}

const provider = new Provider();
google.register(provider);
export default provider;

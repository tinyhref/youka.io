import cheerio from "cheerio";
import got from "./got";
import * as google from "./google_site";
import { GoogleLyricsProvider } from "..";

class Provider implements GoogleLyricsProvider {
  name = "karaoke.ru";
  site = "https://www.karaoke.ru/artists/*/text/";
  site_re = /https:\/\/www\.karaoke\.ru\/artists\/.*\/text\/.*/;

  supported(lang: string) {
    return lang === "ru";
  }

  async search(query: string, lang: string) {
    return google.search(this.name, query, lang);
  }

  async lyrics(url: string) {
    const html = await got(url).text();
    const $ = cheerio.load(html);
    const text = $(".song-text").text();
    return text.trim();
  }
}

const provider = new Provider();
google.register(provider);
export default provider;

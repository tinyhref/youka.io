import cheerio from "cheerio";
import got from "./got";
import * as google from "./google_site";
import { GoogleLyricsProvider } from "..";

class Provider implements GoogleLyricsProvider {
  name = "kapook.com";
  site = "https://musicstation.kapook.com/";
  site_re = /https:\/\/musicstation.kapook.com\/.*/;

  supported(lang: string) {
    return lang === "th";
  }

  async search(query: string, lang: string) {
    return google.search(this.name, query, lang);
  }

  async lyrics(url: string) {
    const html = await got(url).text();
    const $ = cheerio.load(html);
    const l = $("tbody p").text().trim();
    return l;
  }
}

const provider = new Provider();
google.register(provider);
export default provider;

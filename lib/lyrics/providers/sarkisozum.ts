import cheerio from "cheerio";
import got from "./got";
import * as google from "./google_site";
import { GoogleLyricsProvider } from "..";

class Provider implements GoogleLyricsProvider {
  name = "sarkisozum.gen.tr";
  site = "https://www.sarkisozum.gen.tr/";
  site_re = /https:\/\/www\.sarkisozum\.gen\.tr\/.*-lyrics/;

  supported(lang: string) {
    return lang === "tr";
  }

  async search(query: string, lang: string) {
    return google.search(this.name, query, lang);
  }

  async lyrics(url: string) {
    const html = await got(url).text();
    const $ = cheerio.load(html);
    const text = $("#contentArea > div:nth-child(2) > div").text();
    return text.trim();
  }
}

const provider = new Provider();
google.register(provider);
export default provider;

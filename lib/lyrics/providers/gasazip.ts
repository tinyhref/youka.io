import cheerio from "cheerio";
import got from "./got";
import * as google from "./google_site";
import { GoogleLyricsProvider } from "..";

class Provider implements GoogleLyricsProvider {
  name = "gasazip.com";
  site = `https://gasazip.com/`;
  site_re = /https:\/\/gasazip\.com\/\d+/;

  supported(lang: string) {
    return lang === "ko";
  }

  async search(query: string, lang: string) {
    return google.search(this.name, query, lang);
  }

  async lyrics(url: string) {
    const html = await got(url).text();
    const $ = cheerio.load(html);
    const text = $("#gasa").text().trim();
    return text;
  }
}

const provider = new Provider();
google.register(provider);
export default provider;

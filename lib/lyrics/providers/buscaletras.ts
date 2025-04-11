import cheerio from "cheerio";
import got from "./got";
import * as google from "./google_site";
import { GoogleLyricsProvider } from "..";

class Provider implements GoogleLyricsProvider {
  name = "buscaletras.com";
  site = "https://www.buscaletras.com/";
  site_re = /https:\/\/www\.buscaletras\.com\/.*\/.*/;

  supported(lang: string) {
    return lang === "es";
  }

  async search(query: string, lang: string) {
    return google.search(this.name, query, lang);
  }

  async lyrics(url: string) {
    const html = await got(url).text();
    const $ = cheerio.load(html);
    let text = "";
    $(".primary .entry-content p").each((i, el) => {
      text += $(el).text().trim() + "\n\n";
    });
    return text.trim();
  }
}

const provider = new Provider();
google.register(provider);
export default provider;

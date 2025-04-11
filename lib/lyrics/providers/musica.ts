import he from "he";
import cheerio from "cheerio";
import got from "./got";
import * as google from "./google_site";
import { GoogleLyricsProvider } from "..";

class Provider implements GoogleLyricsProvider {
  name = "musica.com";
  site = "https://www.musica.com/letras.asp";
  site_re = /https:\/\/www\.musica\.com\/letras\.asp\?letra=\d+/;

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
    $("#letra p").each((i, el) => {
      text += $(el).html()?.split("<br>").join("\n") + "\n\n";
    });
    return he.unescape(text.trim());
  }
}

const provider = new Provider();
google.register(provider);
export default provider;

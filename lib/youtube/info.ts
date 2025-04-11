import cheerio from "cheerio";
import { ISongPreview } from "@/types";
import got from "./got";
import { cleanTitle, imageUrl } from "./utils";

export async function info(id: string): Promise<ISongPreview | undefined> {
  const url = `https://www.youtube.com/watch?v=${id}`;
  const response = await got(url);
  const $ = cheerio.load(response.body);
  const title = $('meta[name="title"]').attr("content");
  let duration: number | undefined;

  const durationStr = $("meta[itemprop='duration']").attr("content"); // PT45M36S
  if (durationStr) {
    const parsed = durationStr.match(/PT(\d+)M(\d+)S/);
    if (parsed?.length === 3) {
      const tmp = parseInt(parsed[1]) * 60 + parseInt(parsed[2]);
      if (tmp && typeof tmp === "number") {
        duration = tmp;
      }
    }
  }

  if (!title) {
    return;
  }

  const song: ISongPreview = {
    type: "song",
    status: "preview",
    id,
    title: cleanTitle(title),
    image: imageUrl(id),
    duration,
  };

  return song;
}

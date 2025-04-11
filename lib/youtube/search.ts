import {
  IParsedSearchResult,
  IPlaylistPreview,
  ISearchResult,
  ISongPreview,
  SearchNextFunc,
} from "@/types";
import { info } from "./info";
import {
  parseSearchBody,
  parseSearchNextBody,
  parseSearchPlaylistBody,
  parseSearchPlaylistNextBody,
} from "./parsers";
import { parseYoutubeId } from "./utils";
import * as report from "@/lib/report";

const filter = (i: ISongPreview | IPlaylistPreview) =>
  Boolean(
    i.type === "playlist" ||
      (i.type === "song" && i.duration && i.duration < 900)
  );

export async function search(
  query: string,
  signal?: AbortSignal
): Promise<ISearchResult<ISongPreview | IPlaylistPreview>> {
  if (!query || query.trim() === "")
    return {
      items: [],
      next: async () => undefined,
    };

  const id = parseYoutubeId(query);
  if (id) {
    const i = await info(id);
    if (i) {
      return {
        items: [i],
        next: async () => undefined,
      };
    } else if (query.match("^https?://")) {
      report.warn("Could not get title", id);
    }
  }

  const context = {
    context: {
      client: {
        clientName: "WEB",
        clientVersion: "2.20230523.00.01",
      },
    },
    query,
    // params: "EgIQAQ%3D%3D",
  };

  const response = await fetch(
    "https://www.youtube.com/youtubei/v1/search?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8&prettyPrint=false",
    {
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(context),
      method: "POST",
      signal,
    }
  );

  const json = await response.json();

  const { token, items } = parseSearchBody(json);

  const next: SearchNextFunc<ISongPreview | IPlaylistPreview> = token
    ? () => searchNext(token, parseSearchNextBody, filter)
    : async () => undefined;

  const filteredItems = items.filter(filter);

  return {
    items: filteredItems,
    next,
  };
}

export async function searchPlaylists(
  query: string
): Promise<ISearchResult<IPlaylistPreview>> {
  const context = {
    context: {
      client: {
        clientName: "WEB",
        clientVersion: "2.20230523.00.01",
      },
    },
    query,
    params: "EgIQAw%3D%3D",
  };

  const response = await fetch(
    "https://www.youtube.com/youtubei/v1/search?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8&prettyPrint=false",
    {
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(context),
      method: "POST",
    }
  );

  const json = await response.json();

  const { token, items } = parseSearchPlaylistBody(json);

  const next: SearchNextFunc<IPlaylistPreview> = token
    ? () => searchNext<IPlaylistPreview>(token, parseSearchPlaylistNextBody)
    : async () => undefined;

  return {
    items,
    next,
  };
}

export async function searchNext<T>(
  continuation: string,
  parser: (body: any) => IParsedSearchResult<T>,
  filter: (item: T) => boolean = () => true
) {
  const context = {
    context: {
      client: {
        clientName: "WEB",
        clientVersion: "2.20230523.00.01",
      },
    },
    continuation,
  };

  const response = await fetch(
    "https://www.youtube.com/youtubei/v1/search?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8&prettyPrint=false",
    {
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(context),
      method: "POST",
    }
  );

  const json = await response.json();

  const { items, token } = parser(json);

  const next: SearchNextFunc<T> = token
    ? () => searchNext(token, parser, filter)
    : async () => undefined;

  const filteredItems = items.filter(filter);

  return {
    next,
    items: filteredItems,
  };
}

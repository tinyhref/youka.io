import { PageType } from "./types";
import {
  AlbumType,
  IAlbumPreview,
  IArtistBase,
  IChannelPreview,
  IChannelProcessed,
  IParsedSearchResult,
  IPlaylistPreview,
  IPlaylistProcessed,
  ISongPreview,
} from "@/types";
import { cleanTitle, imageUrl, parseDurationSeconds } from "./utils";
import * as report from "@/lib/report";

const explicitBadgeText = "MUSIC_EXPLICIT_BADGE";

const parseDuration = (durationLabel: string): number => {
  const durationList = durationLabel.split(":");
  return durationList.length === 3
    ? parseInt(durationList[0], 10) * 3600 +
        parseInt(durationList[1], 10) * 60 +
        parseInt(durationList[2], 10)
    : parseInt(durationList[0], 10) * 60 + parseInt(durationList[1], 10);
};

const getAlbumType = (typeText: string): AlbumType => {
  switch (typeText) {
    case AlbumType.album:
      return AlbumType.album;
    case AlbumType.ep:
      return AlbumType.ep;
    default:
      return AlbumType.single;
  }
};
// Detects multiple artists of the MusicVideo
export const listArtists = (data: any[]): IArtistBase[] => {
  const artists: IArtistBase[] = [];
  data.forEach((item) => {
    if (
      item.navigationEndpoint &&
      item.navigationEndpoint.browseEndpoint
        .browseEndpointContextSupportedConfigs.browseEndpointContextMusicConfig
        .pageType === PageType.artist
    ) {
      artists.push({
        type: "artist",
        id: item.navigationEndpoint.browseEndpoint.browseId,
        name: item.text,
      });
    }
  });
  if (artists.length === 0) {
    const delimiterIndex = data.findIndex((item) => item.text === " • ");
    if (delimiterIndex !== -1) {
      data
        .filter((item, index) => index < delimiterIndex && item.name !== " & ")
        .forEach((item) => artists.push({ type: "artist", name: item.text }));
    }
  }
  return artists;
};

export const parseMusicItem = (content: {
  musicResponsiveListItemRenderer: {
    flexColumns: {
      musicResponsiveListItemFlexColumnRenderer: {
        text: {
          runs: {
            text: string;
            navigationEndpoint: {
              watchEndpoint: { videoId: string };
              browseId: string;
            };
          }[];
        };
      };
    }[];
    thumbnail: {
      musicThumbnailRenderer: {
        thumbnail: { thumbnails: { url: string }[] };
      };
    };
    badges: {
      musicInlineBadgeRenderer: {
        icon: {
          iconType: string;
        };
      };
    }[];
  };
}): any | null => {
  let youtubeId;
  try {
    youtubeId =
      content.musicResponsiveListItemRenderer.flexColumns[0]
        .musicResponsiveListItemFlexColumnRenderer.text.runs[0]
        .navigationEndpoint.watchEndpoint.videoId;
  } catch (err) {}

  let title;
  try {
    title =
      content.musicResponsiveListItemRenderer.flexColumns[0]
        .musicResponsiveListItemFlexColumnRenderer.text.runs[0].text;
  } catch (err) {}

  let artists: IArtistBase[] = [];
  try {
    artists = listArtists(
      content.musicResponsiveListItemRenderer.flexColumns[1]
        .musicResponsiveListItemFlexColumnRenderer.text.runs
    );
  } catch (err) {}

  // let album;
  // try {
  //   const {
  //     length,
  //   } = content.musicResponsiveListItemRenderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs;
  //   album =
  //     content.musicResponsiveListItemRenderer.flexColumns[1]
  //       .musicResponsiveListItemFlexColumnRenderer.text.runs[length - 3].text;
  // } catch (err) { }

  // let thumbnailUrl;
  // try {
  //   thumbnailUrl = content.musicResponsiveListItemRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails.pop()
  //     ?.url;
  // } catch (err) {}

  let duration;
  try {
    const label =
      content.musicResponsiveListItemRenderer.flexColumns[1]
        .musicResponsiveListItemFlexColumnRenderer.text.runs[
        content.musicResponsiveListItemRenderer.flexColumns[1]
          .musicResponsiveListItemFlexColumnRenderer.text.runs.length - 1
      ].text;
    duration = parseDuration(label);
  } catch (err) {}

  // let isExplicit;
  // try {
  //   isExplicit =
  //     content.musicResponsiveListItemRenderer.badges[0].musicInlineBadgeRenderer
  //       .icon.iconType === explicitBadgeText;
  // } catch (err) {
  //   isExplicit = false;
  // }

  if (!youtubeId) {
    return null;
  }

  return {
    type: "song",
    status: "preview",
    id: youtubeId,
    title: title || "",
    artists,
    // album,
    image: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
    duration,
    // isExplicit,
  };
};

export const parseSuggestionItem = (content: {
  playlistPanelVideoRenderer: {
    navigationEndpoint: { watchEndpoint: { videoId: string } };
    title: { runs: { text: string }[] };
    longBylineText: { runs: { text: string }[] };
    thumbnail: { thumbnails: { url: string }[] };
    lengthText: { runs: { text: string }[] };
    badges: { musicInlineBadgeRenderer: { icon: { iconType: string } } }[];
  };
}): any | null => {
  let youtubeId;
  try {
    youtubeId =
      content.playlistPanelVideoRenderer.navigationEndpoint.watchEndpoint
        .videoId;
  } catch (err) {}

  let title = "";
  try {
    title = content.playlistPanelVideoRenderer.title.runs[0].text;
  } catch (err) {}

  let artists: IArtistBase[] = [];
  try {
    artists = listArtists(
      content.playlistPanelVideoRenderer.longBylineText.runs
    );
  } catch (err) {}

  // let album;
  // try {
  //   album = content.playlistPanelVideoRenderer.longBylineText.runs[2].text;
  // } catch (err) { }

  // let isExplicit;
  // try {
  //   isExplicit =
  //     content.playlistPanelVideoRenderer.badges[0].musicInlineBadgeRenderer.icon
  //       .iconType === "MUSIC_EXPLICIT_BADGE";
  // } catch (err) {
  //   isExplicit = false;
  // }

  let thumbnailUrl;
  try {
    thumbnailUrl = content.playlistPanelVideoRenderer.thumbnail.thumbnails.pop()
      ?.url;
  } catch (err) {}

  let duration;
  try {
    duration = parseDuration(
      content.playlistPanelVideoRenderer.lengthText.runs[0].text
    );
  } catch (err) {}

  if (!youtubeId) {
    return null;
  }

  return {
    type: "song",
    status: "preview",
    id: youtubeId,
    title,
    artists,
    // isExplicit,
    // album,
    image: thumbnailUrl || "",
    duration,
  };
};

export function parseType(
  s: string
): "playlist" | "album" | "artist" | "channel" {
  switch (s) {
    case "MUSIC_PAGE_TYPE_PLAYLIST":
      return "playlist";
    case "MUSIC_PAGE_TYPE_ALBUM":
      return "album";
    case "MUSIC_PAGE_TYPE_ARTIST":
      return "artist";
    case "MUSIC_PAGE_TYPE_USER_CHANNEL":
      return "channel";
    default:
      return "channel";
  }
}

export const parseSearchPlaylistNextBody = (
  body: any
): IParsedSearchResult<IPlaylistPreview> => {
  const token =
    body.onResponseReceivedCommands[0].appendContinuationItemsAction
      .continuationItems[1].continuationItemRenderer.continuationEndpoint
      .continuationCommand.token;
  const items: IPlaylistPreview[] = [];

  body.onResponseReceivedCommands[0].appendContinuationItemsAction.continuationItems[0].itemSectionRenderer.contents.forEach(
    (content: any) => {
      const playlistRenderer = content.playlistRenderer;
      if (!playlistRenderer) return;

      const playlist: IPlaylistPreview = {
        type: "playlist",
        status: "preview",
        id: playlistRenderer.playlistId,
        title: playlistRenderer.title.simpleText,
        image: playlistRenderer.thumbnails[0].thumbnails[0].url.split("?")[0],
        count: parseInt(playlistRenderer.videoCount),
      };
      items.push(playlist);
    }
  );

  return {
    items,
    token,
  };
};

export const parseSearchPlaylistBody = (
  body: any
): IParsedSearchResult<IPlaylistPreview> => {
  if (!body.contents && body.onResponseReceivedCommands)
    return parseSearchPlaylistNextBody(body);

  const items: IPlaylistPreview[] = [];

  const token =
    body.contents.twoColumnSearchResultsRenderer.primaryContents
      .sectionListRenderer.contents[1].continuationItemRenderer
      .continuationEndpoint.continuationCommand.token;

  body.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents.forEach(
    (content: any) => {
      const playlistRenderer = content.playlistRenderer;
      if (!playlistRenderer) return;

      const playlist: IPlaylistPreview = {
        type: "playlist",
        status: "preview",
        id: playlistRenderer.playlistId,
        title: playlistRenderer.title.simpleText,
        image: playlistRenderer.thumbnails[0].thumbnails[0].url.split("?")[0],
        count: parseInt(playlistRenderer.videoCount),
      };
      items.push(playlist);
    }
  );

  return {
    items,
    token,
  };
};

export const parsePlaylistBody = (
  body: any
): IPlaylistProcessed | undefined => {
  const pl = body.contents.twoColumnWatchNextResults.playlist.playlist;
  const items: ISongPreview[] = [];
  pl.contents.forEach((content: any) => {
    const p = content.playlistPanelVideoRenderer;
    if (!p) {
      return;
    }
    const item: ISongPreview = {
      type: "song",
      status: "preview",
      id: p.videoId,
      title: cleanTitle(p.title.simpleText),
      image: imageUrl(p.videoId),
    };
    items.push(item);
  });

  const playlist: IPlaylistProcessed = {
    type: "playlist",
    status: "processed",
    id: pl.playlistId,
    title: pl.title,
    count: pl.totalVideos,
    image: "",
    items,
  };

  return playlist;
};

export const parseMusicInPlaylistItem = (content: {
  musicResponsiveListItemRenderer: {
    thumbnail: {
      musicThumbnailRenderer: {
        thumbnail: {
          thumbnails: { url: string }[];
        };
      };
    };
    fixedColumns: {
      musicResponsiveListItemFixedColumnRenderer: {
        text: { runs: { text: string }[] };
      };
    }[];
    flexColumns: {
      musicResponsiveListItemFlexColumnRenderer: {
        text: {
          runs: {
            navigationEndpoint: { watchEndpoint: { videoId: string } };
            text: string;
          }[];
        };
      };
    }[];
    badges: {
      musicInlineBadgeRenderer: {
        icon: {
          iconType: string;
        };
      };
    }[];
  };
}): any | null => {
  let youtubeId;
  try {
    youtubeId =
      content.musicResponsiveListItemRenderer.flexColumns[0]
        .musicResponsiveListItemFlexColumnRenderer.text.runs[0]
        .navigationEndpoint.watchEndpoint.videoId;
  } catch (err) {}

  let title = "";
  try {
    title =
      content.musicResponsiveListItemRenderer.flexColumns[0]
        .musicResponsiveListItemFlexColumnRenderer.text.runs[0].text;
  } catch (err) {}

  let artists: IArtistBase[] = [];
  try {
    artists = listArtists(
      content.musicResponsiveListItemRenderer.flexColumns[1]
        .musicResponsiveListItemFlexColumnRenderer.text.runs
    );
  } catch (err) {}

  // let album = "";
  // try {
  //   album =
  //     content.musicResponsiveListItemRenderer.flexColumns[2]
  //       .musicResponsiveListItemFlexColumnRenderer.text.runs[0].text;
  // } catch (err) { }

  // let thumbnailUrl;
  // try {
  //   thumbnailUrl = content.musicResponsiveListItemRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails.pop()
  //     ?.url;
  // } catch (err) { }

  let duration;
  try {
    duration = parseDuration(
      content.musicResponsiveListItemRenderer.fixedColumns[0]
        .musicResponsiveListItemFixedColumnRenderer.text.runs[0].text
    );
  } catch (err) {}

  // let isExplicit;
  // try {
  //   isExplicit =
  //     content.musicResponsiveListItemRenderer?.badges[0]
  //       .musicInlineBadgeRenderer.icon.iconType === explicitBadgeText;
  // } catch (err) {
  //   isExplicit = false;
  // }

  if (!youtubeId) {
    return null;
  }

  return {
    type: "song",
    status: "preview",
    id: youtubeId,
    title,
    artists,
    // album,
    image: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
    duration,
    // isExplicit,
  };
};

export const parseAlbumItem = (content: {
  musicResponsiveListItemRenderer: {
    thumbnail: {
      musicThumbnailRenderer: {
        thumbnail: {
          thumbnails: { url: string }[];
        };
      };
    };
    flexColumns: {
      musicResponsiveListItemFlexColumnRenderer: {
        text: {
          runs: {
            text: string;
            navigationEndpoint?: {
              browseEndpoint: {
                browseId: string;
              };
            };
          }[];
        };
      };
    }[];
    navigationEndpoint: {
      browseEndpoint: {
        browseId: string;
        browseEndpointContextSupportedConfigs: {
          browseEndpointContextMusicConfig: {
            pageType: string;
          };
        };
      };
    };
    badges: {
      musicInlineBadgeRenderer: {
        icon: {
          iconType: string;
        };
      };
    }[];
  };
}): IAlbumPreview | null => {
  let albumId;
  try {
    albumId =
      content.musicResponsiveListItemRenderer.navigationEndpoint.browseEndpoint
        .browseId;
  } catch (err) {
    console.error("Couldn't parse albumId", err);
  }

  let title;
  try {
    title =
      content.musicResponsiveListItemRenderer.flexColumns[0]
        .musicResponsiveListItemFlexColumnRenderer.text.runs[0].text;
  } catch (err) {
    console.error("Couldn't parse title", err);
  }

  let type;
  try {
    type = getAlbumType(
      content.musicResponsiveListItemRenderer.flexColumns[1]
        .musicResponsiveListItemFlexColumnRenderer.text.runs[0].text
    );
  } catch (err) {
    console.error("Couldn't parse album type", err);
  }

  let thumbnailUrl;
  try {
    thumbnailUrl = content.musicResponsiveListItemRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails.pop()
      ?.url;
  } catch (err) {
    console.error("Couldn't parse thumbnailUrl", err);
  }

  let artist;
  try {
    artist =
      content.musicResponsiveListItemRenderer.flexColumns[1]
        .musicResponsiveListItemFlexColumnRenderer.text.runs[2].text;
  } catch (err) {
    console.error("Couldn't parse artist", err);
  }

  let artistId;
  try {
    artistId =
      content.musicResponsiveListItemRenderer.flexColumns[1]
        .musicResponsiveListItemFlexColumnRenderer.text.runs[2]
        .navigationEndpoint?.browseEndpoint.browseId;
  } catch (err) {
    console.error("Couldn't parse artistId", err);
  }

  let year;
  try {
    year =
      content.musicResponsiveListItemRenderer.flexColumns[1]
        .musicResponsiveListItemFlexColumnRenderer.text.runs[4].text;
  } catch (err) {
    console.error("Couldn't parse year", err);
  }

  let isExplicit;
  try {
    isExplicit =
      content.musicResponsiveListItemRenderer?.badges[0]
        .musicInlineBadgeRenderer.icon.iconType === explicitBadgeText;
  } catch (err) {
    isExplicit = false;
  }

  if (!albumId || !title) {
    return null;
  }

  return {
    id: albumId,
    type: "album",
    status: "preview",
    title,
    albumType: type,
    image: thumbnailUrl || "",
    artist,
    artistId,
    year,
    isExplicit,
  };
};

export const parseAlbumHeader = (content: {
  musicDetailHeaderRenderer: {
    title: {
      runs: {
        text: string;
      }[];
    };
    subtitle: {
      runs: {
        text: string;
      }[];
    };
    thumbnail: {
      croppedSquareThumbnailRenderer: {
        thumbnail: {
          thumbnails: {
            url: string;
          }[];
        };
      };
    };
  };
}): any => {
  let artist;
  try {
    artist = content.musicDetailHeaderRenderer.subtitle.runs[2].text;
  } catch (err) {
    console.error("Couldn't parse artist from album header", err);
  }
  let album;
  try {
    album = content.musicDetailHeaderRenderer.title.runs[0].text;
  } catch (err) {
    console.error("Couldn't parse title from album header", err);
  }
  let thumbnailUrl;
  try {
    thumbnailUrl = content.musicDetailHeaderRenderer.thumbnail.croppedSquareThumbnailRenderer.thumbnail.thumbnails.pop()
      ?.url;
  } catch (err) {
    console.error("Couldn't parse thumbnailUrl from album header", err);
  }
  return {
    artist,
    album,
    thumbnailUrl,
  };
};

export const parseMusicInAlbumItem = (content: {
  musicResponsiveListItemRenderer: {
    fixedColumns: {
      musicResponsiveListItemFixedColumnRenderer: {
        text: {
          runs: {
            text: string;
          }[];
        };
      };
    }[];
    flexColumns: {
      musicResponsiveListItemFlexColumnRenderer: {
        text: {
          runs: {
            text: string;
            navigationEndpoint: {
              watchEndpoint: {
                videoId: string;
              };
            };
          }[];
        };
      };
    }[];
    badges: {
      musicInlineBadgeRenderer: {
        icon: {
          iconType: string;
        };
      };
    }[];
  };
}): any => {
  let youtubeId = "";
  try {
    youtubeId =
      content.musicResponsiveListItemRenderer.flexColumns[0]
        .musicResponsiveListItemFlexColumnRenderer.text.runs[0]
        .navigationEndpoint.watchEndpoint.videoId;
  } catch (err) {}

  let title = "";
  try {
    title =
      content.musicResponsiveListItemRenderer.flexColumns[0]
        .musicResponsiveListItemFlexColumnRenderer.text.runs[0].text;
  } catch (err) {}

  const artists: IArtistBase[] = [];
  try {
    if (
      content.musicResponsiveListItemRenderer.flexColumns[1]
        ?.musicResponsiveListItemFlexColumnRenderer.text.runs
    )
      for (
        let i = 0;
        i <
        content.musicResponsiveListItemRenderer.flexColumns[1]
          .musicResponsiveListItemFlexColumnRenderer.text.runs.length;
        i += 2
      ) {
        artists.push({
          type: "artist",
          name:
            content.musicResponsiveListItemRenderer.flexColumns[1]
              .musicResponsiveListItemFlexColumnRenderer.text.runs[i].text,
        });
      }
  } catch (err) {}

  let duration;
  try {
    duration = parseDuration(
      content.musicResponsiveListItemRenderer.fixedColumns[0]
        .musicResponsiveListItemFixedColumnRenderer.text.runs[0].text
    );
  } catch (err) {}
  // let isExplicit;
  // try {
  //   isExplicit =
  //     content.musicResponsiveListItemRenderer?.badges[0]
  //       .musicInlineBadgeRenderer.icon.iconType === explicitBadgeText;
  // } catch (err) {
  //   isExplicit = false;
  // }

  return {
    type: "song",
    status: "preview",
    id: youtubeId,
    title,
    artists,
    image: "",
    duration,
    // isExplicit,
  };
};

export const parseArtistsAlbumItem = (item: {
  musicTwoRowItemRenderer: {
    title: {
      runs: {
        text: string;
        navigationEndpoint: {
          browseEndpoint: {
            browseId: string;
            browseEndpointContextSupportedConfigs: {
              browseEndpointContextMusicConfig: {
                pageType: string;
              };
            };
          };
        };
      }[];
    };
    subtitle: {
      runs: {
        text: string;
      }[];
    };
    thumbnailRenderer: {
      musicThumbnailRenderer: {
        thumbnail: {
          thumbnails: {
            url: string;
          }[];
        };
      };
    };
    subtitleBadges: {
      musicInlineBadgeRenderer: {
        icon: {
          iconType: string;
        };
      };
    }[];
  };
}): IAlbumPreview | undefined => {
  let title;
  try {
    title = item.musicTwoRowItemRenderer.title.runs[0].text;
  } catch (e) {
    console.error("Couldn't get title", e);
  }

  let type;
  try {
    type = getAlbumType(item.musicTwoRowItemRenderer.subtitle.runs[0].text);
  } catch (e) {
    console.error("Couldn't get album type", e);
  }

  let albumId;
  try {
    albumId =
      item.musicTwoRowItemRenderer.title.runs[0].navigationEndpoint
        .browseEndpoint.browseId;
  } catch (e) {
    console.error("Couldn't get albumId", e);
  }

  let year;
  try {
    year = item.musicTwoRowItemRenderer.subtitle.runs.pop()?.text;
  } catch (e) {
    console.error("Couldn't get year", e);
  }

  let isExplicit;
  try {
    isExplicit =
      item.musicTwoRowItemRenderer.subtitleBadges[0].musicInlineBadgeRenderer
        .icon.iconType === explicitBadgeText;
  } catch (e) {
    isExplicit = false;
  }
  let thumbnailUrl;
  try {
    thumbnailUrl = item.musicTwoRowItemRenderer.thumbnailRenderer.musicThumbnailRenderer.thumbnail.thumbnails.shift()
      ?.url;
  } catch (e) {
    console.error("Couldn't get thumbnailUrl", e);
  }

  if (!albumId || !title) {
    return;
  }

  return {
    id: albumId,
    type: "album",
    status: "preview",
    albumType: type,
    title,
    year,
    image: thumbnailUrl || "",
    isExplicit,
  };
};

const parseArtistsSuggestionsItem = (item: {
  musicTwoRowItemRenderer: {
    thumbnailRenderer: {
      musicThumbnailRenderer: {
        thumbnail: {
          thumbnails: {
            url: string;
          }[];
        };
      };
    };
    title: {
      runs: {
        text: string;
        navigationEndpoint: {
          browseEndpoint: {
            browseId: string;
          };
        };
      }[];
    };
    subtitle: {
      runs: {
        text: string;
      }[];
    };
  };
}): IChannelPreview | undefined => {
  let artistId;
  try {
    artistId =
      item.musicTwoRowItemRenderer.title.runs[0].navigationEndpoint
        .browseEndpoint.browseId;
  } catch (e) {
    console.error("Couldn't get artistId", e);
  }

  let name;
  try {
    name = item.musicTwoRowItemRenderer.title.runs[0].text;
  } catch (e) {
    console.error("Couldn't get name", e);
  }

  let subscribers;
  try {
    subscribers = item.musicTwoRowItemRenderer.subtitle.runs[0].text;
    const subscribersArray = subscribers.split(" ");
    subscribersArray.pop();
    subscribers = subscribersArray.join(" ");
  } catch (e) {
    console.error("Couldn't get subscribers", e);
  }

  let thumbnailUrl;
  try {
    thumbnailUrl = item.musicTwoRowItemRenderer.thumbnailRenderer.musicThumbnailRenderer.thumbnail.thumbnails.pop()
      ?.url;
  } catch (e) {
    console.error("Couldn't get thumbnailUrl", e);
  }

  if (!artistId || !name) {
    return;
  }

  return {
    type: "artist",
    status: "preview",
    id: artistId,
    name,
    // subscribers,
    image: thumbnailUrl || "",
  };
};

export const parseArtistPlaylistsBody = (
  body: any
): IPlaylistPreview[] | undefined => {
  const tab = body.contents.twoColumnBrowseResultsRenderer.tabs.find(
    (tab: any) =>
      tab.tabRenderer.endpoint.browseEndpoint.params ===
      "EglwbGF5bGlzdHPyBgQKAkIA"
  );
  if (!tab) return;

  const playlists: IPlaylistPreview[] = tab.tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].gridRenderer.items.map(
    parsePlaylistsItem
  );

  return playlists;
};

export const parsePlaylistsItem = (item: any): IPlaylistPreview => {
  const playlist: IPlaylistPreview = {
    type: "playlist",
    status: "preview",
    id:
      item.gridPlaylistRenderer.viewPlaylistText.runs[0].navigationEndpoint
        .browseEndpoint.browseId,
    title: item.gridPlaylistRenderer.title.runs[0].text,
    image: item.gridPlaylistRenderer.thumbnail.thumbnails[0].url,
    count: parseInt(item.gridPlaylistRenderer.videoCountShortText.simpleText),
  };

  return playlist;
};

export const parseArtistData = (body: any): IChannelProcessed | undefined => {
  const artistId =
    body.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.endpoint
      .browseEndpoint.browseId;

  let name;
  try {
    name = body.header.musicImmersiveHeaderRenderer.title.runs[0].text;
  } catch (e) {
    console.error("Couldn't get artist name", e);
  }

  // let description;
  // try {
  //   description =
  //     body.header.musicImmersiveHeaderRenderer.description.runs[0].text;
  // } catch (e) {
  //   console.error("Couldn't get artist description", e);
  // }

  const thumbnails: any[] = [];
  try {
    const thumbnailArray =
      body.header.musicImmersiveHeaderRenderer.thumbnail.musicThumbnailRenderer
        .thumbnail.thumbnails;
    thumbnailArray.forEach((e: any) => {
      thumbnails.push(e);
    });
  } catch (e) {
    console.error("Couldn't get artist thumbnails", e);
  }

  // let songsPlaylistId;
  // try {
  //   songsPlaylistId =
  //     body.contents.singleColumnBrowseResultsRenderer.tabs[0].tabRenderer
  //       .content.sectionListRenderer.contents[0].musicCarouselShelfRenderer.title
  //       .runs[0].navigationEndpoint.browseEndpoint.browseId;
  // } catch (e) {
  //   console.error("Couldn't get artist songPlaylistId", e);
  // }

  const albums: IAlbumPreview[] = [];
  const singles: IAlbumPreview[] = [];
  try {
    const {
      contents,
    } = body.contents.singleColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer;
    for (const shelf of contents) {
      if (shelf.musicCarouselShelfRenderer?.contents) {
        if (
          shelf.musicCarouselShelfRenderer.contents[0].musicTwoRowItemRenderer
            .title.runs[0].navigationEndpoint?.browseEndpoint
            .browseEndpointContextSupportedConfigs
            .browseEndpointContextMusicConfig.pageType === PageType.album
        )
          shelf.musicCarouselShelfRenderer.contents.forEach((item: any) => {
            const parsedItem = parseArtistsAlbumItem(item);
            if (parsedItem?.albumType === AlbumType.single)
              singles.push(parsedItem);
            else if (parsedItem) albums.push(parsedItem);
          });
      }
    }
  } catch (e) {
    console.error("Couldn't get albums", e);
  }

  const suggestedArtists: IChannelPreview[] = [];
  try {
    const {
      contents,
    } = body.contents.singleColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer;
    for (let i = contents.length - 1; i >= 0; i -= 1) {
      if (contents[i].musicCarouselShelfRenderer) {
        if (
          contents[i].musicCarouselShelfRenderer.contents[0]
            .musicTwoRowItemRenderer.title.runs[0].navigationEndpoint
            .browseEndpoint.browseEndpointContextSupportedConfigs
            .browseEndpointContextMusicConfig.pageType === PageType.artist
        )
          contents[i].musicCarouselShelfRenderer.contents.forEach((v: any) => {
            const suggestedArtist = parseArtistsSuggestionsItem(v);
            if (suggestedArtist) {
              suggestedArtists.push(suggestedArtist);
            }
          });
        break;
      }
    }
  } catch (e) {
    console.error("Couldn't get suggestedArtists", e);
  }

  // let subscribers;
  // try {
  //   subscribers =
  //     body.header.musicImmersiveHeaderRenderer.subscriptionButton
  //       .subscribeButtonRenderer.subscriberCountWithSubscribeText.runs[0].text;
  // } catch (e) {
  //   console.error("Couldn't get subscribers", e);
  // }

  if (!artistId || !name) {
    return;
  }
  return {
    type: "artist",
    status: "processed",
    id: artistId,
    name,
    image: thumbnails.length ? thumbnails[0] : "",
    // description,
    // albums,
    // singles,
    // thumbnails,
    // songsPlaylistId,
    // subscribers,
    suggestedChannels: suggestedArtists,
  };
};

export const parseVideoItem = (item: any): ISongPreview | undefined => {
  const song: ISongPreview = {
    type: "song",
    status: "preview",
    id: item.videoId,
    title: cleanTitle(item.title.runs[0].text),
    image: imageUrl(item.videoId),
    duration: parseDurationSeconds(item.lengthText?.simpleText),
  };

  if (item.ownerText) {
    song.channel = {
      type: "channel",
      id: item.ownerText.runs[0].navigationEndpoint.browseEndpoint.browseId,
      name: item.ownerText.runs[0].text,
    };
  }
  return song;
};

export const parseArtistChannelBody = (
  body: any
): IChannelProcessed | undefined => {
  const contents =
    body.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content
      .sectionListRenderer.contents;

  contents.forEach((content: any) => {
    if (content.musicShelfRenderer) {
      // const favorites = contents[9].itemSectionRenderer.contents[0].shelfRenderer.content.horizontalListRenderer.items.map((item: any) => (
      //   {
      //     type: "song",
      //     status: "preview",
      //     id: item.gridVideoRenderer.videoId,
      //     title: item.gridVideoRenderer.title.simpleText,
      //     image: imageUrl(item.gridVideoRenderer.videoId),
      //   }
      // ))
    }
    // const suggestedArtists = contents[10].itemSectionRenderer.contents[0].shelfRenderer.content.horizontalListRenderer.items.map((item: any) => (
    //   {
    //     type: "artist",
    //     status: "preview",
    //     id: item.gridChannelRenderer.channelId,
    //     name: item.gridChannelRenderer.title.simpleText,
    //     image: "https:" + item.gridChannelRenderer.thumbnail.thumbnails[0].url,
    //   }
    // ))
  });

  return {
    type: "artist",
    status: "processed",
    id: body.header.c4TabbedHeaderRenderer.channelId,
    name: body.header.c4TabbedHeaderRenderer.title,
    image: body.header.c4TabbedHeaderRenderer.banner.thumbnails[0].url,
    // favorites,
    // albums,
    // singles,
    // releases,
    // suggestedArtists,
  };
};

export const parseArtistSearchResult = (content: {
  musicResponsiveListItemRenderer: {
    thumbnail: {
      musicThumbnailRenderer: {
        thumbnail: {
          thumbnails: {
            url: string;
          }[];
        };
      };
    };
    flexColumns: {
      musicResponsiveListItemFlexColumnRenderer: {
        text: {
          runs: {
            text: string;
          }[];
        };
      };
    }[];
    navigationEndpoint: {
      browseEndpoint: {
        browseId: string;
      };
    };
  };
}): IChannelPreview | null => {
  let name;
  try {
    name =
      content.musicResponsiveListItemRenderer.flexColumns[0]
        .musicResponsiveListItemFlexColumnRenderer.text.runs[0].text;
  } catch (e) {
    console.error("Couldn't get name", e);
  }

  let artistId;
  try {
    artistId =
      content.musicResponsiveListItemRenderer.navigationEndpoint.browseEndpoint
        .browseId;
  } catch (e) {
    console.error("Couldn't get artistId", e);
  }

  let thumbnailUrl;
  try {
    thumbnailUrl = content.musicResponsiveListItemRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails.pop()
      ?.url;
  } catch (e) {
    console.error("Couldn't get thumbnailUrl", e);
  }

  // let subscribers;
  // try {
  //   subscribers =
  //     content.musicResponsiveListItemRenderer.flexColumns[1]
  //       .musicResponsiveListItemFlexColumnRenderer.text.runs[2].text;
  // } catch (e) {
  //   console.error("Couldn't get subscribers", e);
  // }

  if (!artistId) {
    return null;
  }
  return {
    type: "artist",
    status: "preview",
    id: artistId,
    name: name || "",
    image: thumbnailUrl || "",
    // subscribers,
  };
};

export const parseArtistVideosBody = (body: any): ISongPreview[] => {
  const songs: ISongPreview[] = [];

  body.contents.twoColumnBrowseResultsRenderer.tabs[1].tabRenderer.content.richGridRenderer.contents.forEach(
    (content: any) => {
      const videoRenderer = content.richItemRenderer?.content?.videoRenderer;
      if (!videoRenderer) return;

      let song = parseVideoItem(videoRenderer);
      if (song) {
        song.channel = {
          type: "channel",
          id: body.header.c4TabbedHeaderRenderer.channelId,
          name: body.header.c4TabbedHeaderRenderer.title,
        };
        songs.push(song);
      }
    }
  );

  return songs;
};

export const parseSearchNextBody = (
  body: any
): IParsedSearchResult<ISongPreview> => {
  const continuationItem =
    body.onResponseReceivedCommands[0].appendContinuationItemsAction
      .continuationItems[1];
  const token =
    continuationItem?.continuationItemRenderer?.continuationEndpoint
      ?.continuationCommand?.token;
  const items: ISongPreview[] = [];

  body.onResponseReceivedCommands[0].appendContinuationItemsAction.continuationItems[0].itemSectionRenderer.contents.forEach(
    (content: any) => {
      const videoRenderer = content.videoRenderer;
      if (!videoRenderer) return;

      let song = parseVideoItem(videoRenderer);
      if (song) {
        items.push(song);
      }
    }
  );

  return {
    items,
    token,
  };
};

export const parseDiscoverNextBody = (
  body: any
): IParsedSearchResult<ISongPreview> => {
  const items: ISongPreview[] = [];
  let token = "";

  try {
    const continuationItems =
      body.onResponseReceivedEndpoints[0].appendContinuationItemsAction
        .continuationItems;

    continuationItems.forEach((continuationItem: any) => {
      if (continuationItem.continuationItemRenderer) {
        token =
          continuationItem.continuationItemRenderer.continuationEndpoint
            .continuationCommand.token;
      } else if (continuationItem.compactVideoRenderer) {
        const r = continuationItem.compactVideoRenderer;
        const videoId = r.videoId;
        const title = r.title.simpleText;
        const song: ISongPreview = {
          type: "song",
          status: "preview",
          id: videoId,
          title: cleanTitle(title),
          image: imageUrl(videoId),
          duration: parseDurationSeconds(r.lengthText?.simpleText),
        };
        items.push(song);
      }
    });
  } catch (e) {
    console.error("Couldn't parse discover next body", e);
  }

  return {
    items,
    token,
  };
};

export const parseDiscoverBody = (
  body: any
): IParsedSearchResult<ISongPreview | IPlaylistPreview> => {
  let token: string | undefined;
  const items: Array<ISongPreview | IPlaylistPreview> = [];

  try {
    const secondaryResults =
      body?.contents?.twoColumnWatchNextResults.secondaryResults
        .secondaryResults;

    try {
      token =
        secondaryResults.continuations[0].nextContinuationData.continuation;
    } catch (e) {
      // console.error("Couldn't get token", e);
    }

    secondaryResults.results.forEach((r: any) => {
      if (!r.compactVideoRenderer) {
        // if (r.compactRadioRenderer) {
        //   const p = r.compactRadioRenderer;

        //   const playlist: IPlaylistPreview = {
        //     type: "playlist",
        //     status: "preview",
        //     id: p.playlistId,
        //     title: cleanTitle(p.title.simpleText),
        //     image: p.thumbnail.thumbnails[0].url.split("?")[0],
        //     count: -1,
        //   };
        //   items.push(playlist);
        // }

        return;
      }
      const videoId = r.compactVideoRenderer.videoId;
      const title = r.compactVideoRenderer.title.simpleText;
      const song: ISongPreview = {
        type: "song",
        status: "preview",
        id: videoId,
        title: cleanTitle(title),
        image: imageUrl(videoId),
        duration: parseDurationSeconds(
          r.compactVideoRenderer.lengthText?.simpleText
        ),
      };
      items.push(song);
    });
  } catch (e) {
    console.error("Couldn't parse discover body", e);
  }

  return {
    items,
    token,
  };
};

export const parseSearchBody = (
  body: any
): IParsedSearchResult<ISongPreview | IPlaylistPreview> => {
  let token: string | undefined;

  const items: Array<ISongPreview | IPlaylistPreview> = [];

  body.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents.forEach(
    (c: any) => {
      try {
        if (c?.continuationItemRenderer) {
          token =
            c.continuationItemRenderer.continuationEndpoint.continuationCommand
              .token;
        }
      } catch {}
      c.itemSectionRenderer?.contents?.forEach((content: any) => {
        if (content.videoRenderer) {
          const song = parseVideoItem(content.videoRenderer);
          if (song) {
            items.push(song);
          }
        } else if (content.playlistRenderer) {
          const playlist: IPlaylistPreview = {
            type: "playlist",
            status: "preview",
            id: content.playlistRenderer.playlistId,
            title: cleanTitle(content.playlistRenderer.title.simpleText),
            image: content.playlistRenderer.thumbnails[0].thumbnails[0].url.split(
              "?"
            )[0],
            count: parseInt(content.playlistRenderer.videoCount),
          };
          items.push(playlist);
        }
      });
    }
  );

  return {
    items,
    token,
  };
};

export const parseInfo = (body: any): ISongPreview | undefined => {
  let title;
  try {
    title =
      body.contents?.twoColumnWatchNextResults?.results?.results?.contents[0]
        .videoPrimaryInfoRenderer?.title?.runs[0].text;
  } catch (e) {
    report.warn("Couldn't get youtube title", { e, body });
  }
  if (!title) {
    title = "Untitled";
  }

  const id = body.currentVideoEndpoint?.watchEndpoint?.videoId;

  if (!id) {
    return;
  }

  return {
    type: "song",
    status: "preview",
    id,
    title: cleanTitle(title),
    image: imageUrl(id),
  };
};

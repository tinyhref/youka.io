import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IPlaylist2, IPlaylist2Item } from "@/types";
import { usePlayerStore } from "@/stores/player";
import { Button } from "./ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPlay } from "@fortawesome/free-solid-svg-icons";
import { Playlist2Item } from "./Playlist2Item";
import { Playlist2SongItem } from "./Playlist2SongItem";
import { Separator } from "./ui/separator";
import { faListMusic } from "@/icons";
import { useDrag, useDrop } from "react-dnd";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export default function TabLibraryPlaylists() {
  const { t } = useTranslation();
  const [
    playlists,
    playlistId,
    setPlaylistId,
    playPlaylist,
  ] = usePlayerStore((state) => [
    state.playlists,
    state.playlistId,
    state.setPlaylistId,
    state.playPlaylist,
  ]);
  const [playlist, setPlaylist] = useState<IPlaylist2 | null>(null);
  const [isInsidePlaylist, setIsInsidePlaylist] = useState(false);
  const [, drop] = useDrop(() => ({
    accept: "playlistitem",
  }));

  useEffect(() => {
    if (playlistId) {
      setPlaylist(playlists[playlistId]);
    } else {
      setPlaylist(null);
    }
  }, [playlistId, playlists]);

  useEffect(() => {
    setIsInsidePlaylist(Boolean(playlist));
  }, [playlist]);

  return (
    <>
      <div className="h-[80vh] overflow-y-auto overflow-x-hidden grow-1 rounded-md border">
        <div className="flex flex-col sticky top-0 bg-background z-10">
          <div className="flex flex-row items-center">
            {isInsidePlaylist && playlist && (
              <div className="flex flex-row items-center w-full p-1 justify-between">
                <div className="flex flex-row items-center gap-2 justify-start w-[60%]">
                  <Button variant="outline" onClick={() => setPlaylistId()}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                  </Button>
                  <Tooltip>
                    <TooltipTrigger className="px-2 text-lg font-bold truncate text-nowrap cursor-default">
                      {playlist.title}
                    </TooltipTrigger>
                    <TooltipContent>{playlist.title}</TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex flex-row items-center gap-2 justify-end w-[40%]">
                  <div className="text-sm">
                    {playlist.items.length}{" "}
                    {playlist.items.length === 1 ? "song" : "songs"}
                  </div>
                  <div className="flex flex-row items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => playPlaylist(playlist.id)}
                    >
                      <FontAwesomeIcon className="mr-2" icon={faPlay} />
                      {t("Play")}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {isInsidePlaylist && <Separator />}
        </div>

        {isInsidePlaylist && playlist && (
          <>
            <div className="h-full" ref={drop}>
              {playlist.items.map((playlistItem) => (
                <PlaylistItemRow
                  key={playlistItem.id}
                  playlist={playlist}
                  playlistItem={playlistItem}
                />
              ))}
            </div>
          </>
        )}

        {!isInsidePlaylist &&
          Object.values(playlists).map((playlist) => (
            <div key={playlist.id} onClick={() => setPlaylistId(playlist.id)}>
              <Playlist2Item playlist={playlist} />
            </div>
          ))}

        {!isInsidePlaylist && Object.keys(playlists).length === 0 && (
          <div className="w-full h-full flex flex-col items-center justify-center bg-muted">
            <FontAwesomeIcon icon={faListMusic} size="4x" />
            <div className="p-2">{t("No playlists")}</div>
          </div>
        )}
      </div>
    </>
  );
}

export interface Item {
  id: string;
  originalIndex: number;
}

interface PlaylistItemRowProps {
  playlist: IPlaylist2;
  playlistItem: IPlaylist2Item;
}
export function PlaylistItemRow({
  playlist,
  playlistItem,
}: PlaylistItemRowProps) {
  const [
    songs,
    movePlaylistItem,
    persistPlaylist,
    qid,
  ] = usePlayerStore((state) => [
    state.songs,
    state.movePlaylistItem,
    state.persistPlaylist,
    state.qid,
  ]);
  const [current, setCurrent] = useState(false);
  const song = songs[playlistItem.songId];

  useEffect(() => {
    setCurrent(qid === playlistItem.id);
  }, [playlistItem.id, qid]);

  const findPlaylistItemCb = useCallback(
    (id: string) => {
      const index = playlist.items.findIndex((i) => i.id === id);
      return {
        playlistItem: playlist.items[index],
        index,
      };
    },
    [playlist]
  );

  const movePlaylistItemCb = useCallback(
    (id: string, atIndex: number) => {
      const { index } = findPlaylistItemCb(id);
      movePlaylistItem(playlist.id, index, atIndex);
    },
    [findPlaylistItemCb, movePlaylistItem, playlist.id]
  );

  const originalIndex = findPlaylistItemCb(playlistItem.id).index;
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "playlistitem",
      item: { id: playlistItem.id, originalIndex },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      end: (item, monitor) => {
        const { id: droppedId, originalIndex } = item;
        const didDrop = monitor.didDrop();
        if (!didDrop) {
          movePlaylistItemCb(droppedId, originalIndex);
        }
      },
    }),
    [playlistItem.id, originalIndex, movePlaylistItemCb]
  );

  const [, drop] = useDrop(
    () => ({
      accept: "playlistitem",
      hover({ id: draggedId }: Item) {
        if (draggedId !== playlistItem.id) {
          const overIndex = findPlaylistItemCb(playlistItem.id).index;
          movePlaylistItemCb(draggedId, overIndex);
        }
      },
      drop: async () => {
        await persistPlaylist(playlist.id);
      },
    }),
    [findPlaylistItemCb, movePlaylistItemCb]
  );

  if (song?.status !== "processed") return null;

  return (
    <div
      ref={(node) => drag(drop(node))}
      style={{
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <Playlist2SongItem
        key={playlistItem.id}
        song={song}
        playlist={playlist}
        playlistItem={playlistItem}
        current={current}
      />
    </div>
  );
}

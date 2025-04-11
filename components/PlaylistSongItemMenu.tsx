import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IPlaylist2, IPlaylist2Item, ISongProcessed } from "@/types";
import { usePlayerStore } from "@/stores/player";
import * as report from "@/lib/report";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsisVertical,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { CreatePlaylistDialog } from "./dialogs/CreatePlaylist";
import { randomUUID } from "crypto";

interface Props {
  playlist: IPlaylist2;
  playlistItem: IPlaylist2Item;
  song: ISongProcessed;
}

export function PlaylistSongItemMenu({ playlist, playlistItem, song }: Props) {
  const { t } = useTranslation();
  const [
    addToQueue,
    addToPlaylist,
    removeFromPlaylist,
  ] = usePlayerStore((state) => [
    state.addToQueue,
    state.addToPlaylist,
    state.removeFromPlaylist,
  ]);
  const [createPlaylistOpen, setCreatePlaylistOpen] = useState(false);
  const { toast } = useToast();
  const [isInPlaylist, setIsInPlaylist] = useState(false);

  useEffect(() => {
    setIsInPlaylist(playlist.items.some((item) => item.songId === song.id));
  }, [playlist.items, song.id]);

  function handleAddToQueue(e: any) {
    e.stopPropagation();
    addToQueue(song);
    toast({
      title: "Added to queue",
      description: song.title,
      image: song.image,
    });
  }

  function handleClick(e: any) {
    e.stopPropagation();
  }

  async function handleAddToPlaylist(e: any) {
    e.stopPropagation();
    try {
      const playlistItem: IPlaylist2Item = {
        id: randomUUID(),
        songId: song.id,
      };
      await addToPlaylist(playlist.id, playlistItem);
      toast({
        title: "Added to playlist",
        description: playlist.title,
        image: song.image,
      });
    } catch (error) {
      toast({
        title: "Add to playlist failed",
        description: playlist.title,
      });
      report.error("Add to playlist failed", { error });
    }
  }

  async function handleRemoveFromPlaylist(e: any) {
    e.stopPropagation();
    try {
      await removeFromPlaylist(playlist.id, playlistItem.id);
      toast({
        title: "Removed from playlist",
        description: song.title,
        image: song.image,
      });
    } catch (error) {
      report.error("Remove from playlist failed", { error });
    }
  }

  return (
    <>
      <CreatePlaylistDialog
        items={[playlistItem]}
        open={createPlaylistOpen}
        onOpenChange={setCreatePlaylistOpen}
        image={song.image}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger>
          <FontAwesomeIcon
            className="cursor-pointer px-2"
            icon={faEllipsisVertical}
            onClick={handleClick}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {!isInPlaylist && (
            <DropdownMenuItem onClick={handleAddToPlaylist}>
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              {t("Add to playlist")}
            </DropdownMenuItem>
          )}

          {isInPlaylist && (
            <DropdownMenuItem onClick={handleRemoveFromPlaylist}>
              <FontAwesomeIcon icon={faTrash} className="mr-2" />
              {t("Remove from this playlist")}
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={handleAddToQueue}>
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            {t("Add to queue")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

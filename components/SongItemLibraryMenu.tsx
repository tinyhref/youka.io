import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { IPlaylist2, IPlaylist2Item, Song } from "@/types";
import { usePlayerStore } from "@/stores/player";
import * as report from "@/lib/report";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBug,
  faEllipsisVertical,
  faFolderOpen,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { Delete } from "./dialogs/Delete";
import { CreatePlaylistDialog } from "./dialogs/CreatePlaylist";
import { randomUUID } from "crypto";
import { faListMusic } from "@/icons";
import { ipcRenderer } from "electron";
import { join } from "path";
import { LIBRARY_PATH } from "@/lib/path";
import { exportDebugInfo } from "@/lib/library";

interface Props {
  song: Song;
}

export function SongItemLibraryMenu({ song }: Props) {
  const { t } = useTranslation();
  const [
    addToQueue,
    playlists,
    addToPlaylist,
    deleteSong,
  ] = usePlayerStore((state) => [
    state.addToQueue,
    state.playlists,
    state.addToPlaylist,
    state.deleteSong,
  ]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [createPlaylistOpen, setCreatePlaylistOpen] = useState(false);
  const { toast } = useToast();

  function handleAddToQueue(e: any) {
    e.stopPropagation();
    addToQueue(song);
    toast({
      title: "Added to queue",
      description: song.title,
      image: song.image,
    });
  }

  function handleDelete(e: any) {
    e.stopPropagation();
    setDeleteOpen(true);
  }

  function handleClick(e: any) {
    e.stopPropagation();
  }

  async function handleAddToPlaylist(e: any, playlist: IPlaylist2) {
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

  async function handleDebugInfo(e: any) {
    e.stopPropagation();
    const filepath = await exportDebugInfo(song.id);
    ipcRenderer.send("showItemInFolder", filepath);
  }

  return (
    <>
      <CreatePlaylistDialog
        items={[{ id: randomUUID(), songId: song.id }]}
        open={createPlaylistOpen}
        onOpenChange={setCreatePlaylistOpen}
        image={song.image}
      />
      <Delete
        title={song.title}
        image={song.image}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        successMessage="Karaoke removed successfully"
        errorMessage="Karaoke removal failed"
        fn={() => deleteSong(song)}
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
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FontAwesomeIcon icon={faListMusic} className="mr-2" />
              {t("Add to playlist")}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setCreatePlaylistOpen(true)}>
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                  {t("New playlist")}
                </DropdownMenuItem>
                {Object.keys(playlists).length > 0 && <DropdownMenuSeparator />}
                {Object.entries(playlists).map(([playlistId, playlist]) => (
                  <DropdownMenuItem
                    key={playlistId}
                    onClick={(e) => handleAddToPlaylist(e, playlist)}
                  >
                    {playlists[playlistId].title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuItem onClick={handleAddToQueue}>
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            {t("Add to queue")}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              const filepath = join(LIBRARY_PATH, song.id, "metadata.json");
              ipcRenderer.send("showItemInFolder", filepath);
            }}
          >
            <FontAwesomeIcon icon={faFolderOpen} className="mr-2" />
            {t("Open Directory")}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleDebugInfo}>
            <FontAwesomeIcon icon={faBug} className="mr-2" />
            {t("Debug Info")}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleDelete}>
            <FontAwesomeIcon icon={faTrash} className="mr-2" />
            {t("Delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

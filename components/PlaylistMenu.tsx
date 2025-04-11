import React, { useState } from "react";
import { IPlaylist2 } from "@/types";
import { usePlayerStore } from "@/stores/player";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faEllipsisVertical,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { Delete } from "./dialogs/Delete";
import { EditPlaylistDialog } from "./dialogs/EditPlaylistDialog";
import { t } from "i18next";

interface Props {
  playlist: IPlaylist2;
}

export function PlaylistMenu({ playlist }: Props) {
  const [removePlaylist] = usePlayerStore((state) => [state.removePlaylist]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);

  function handleClick(e: any) {
    e.stopPropagation();
  }

  function handleDelete(e: any) {
    e.stopPropagation();
    setDeleteOpen(true);
  }

  function handleEdit(e: any) {
    e.stopPropagation();
    setRenameOpen(true);
  }

  return (
    <>
      <Delete
        title={playlist.title}
        image={playlist.image}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        successMessage="Playlist deleted successfully"
        errorMessage="Playlist deletion failed"
        fn={() => removePlaylist(playlist.id)}
      />
      <EditPlaylistDialog
        playlist={playlist}
        open={renameOpen}
        onOpenChange={setRenameOpen}
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
          <DropdownMenuItem onClick={handleEdit}>
            <FontAwesomeIcon icon={faEdit} className="mr-2" />
            {t("Edit")}
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

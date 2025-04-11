import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePlayerStore } from "@/stores/player";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { IPlaylist2, IPlaylist2Item } from "@/types";
import { randomUUID } from "crypto";
import { DEFAULT_BACKGROUND_IMAGE_URL } from "@/consts";

interface Props {
  items?: IPlaylist2Item[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (playlist: IPlaylist2) => void;
  image?: string;
}

export const CreatePlaylistDialog = ({
  open,
  onOpenChange,
  onSuccess,
  items,
  image,
}: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const createPlaylist = usePlayerStore((state) => state.createPlaylist);
  const [title, setTitle] = useState("");

  const handleCreate = async () => {
    const selectedImage = image || DEFAULT_BACKGROUND_IMAGE_URL;
    try {
      const playlist: IPlaylist2 = {
        id: randomUUID(),
        title,
        image: selectedImage,
        items: items || [],
      };
      const p2 = await createPlaylist(playlist);
      if (onSuccess) {
        onSuccess(p2);
      }
      toast({
        title: "Playlist created successfully",
        description: title,
        image: selectedImage,
      });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Create playlist failed",
        description: title,
        image: selectedImage,
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("Create playlist")}</AlertDialogTitle>
        </AlertDialogHeader>
        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            {t("Cancel")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleCreate}>
            {t("Save")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

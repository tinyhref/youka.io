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
import { useToast } from "@/components/ui/use-toast";
import { Input } from "../ui/input";
import { IPlaylist2 } from "@/types";
import { Label } from "../ui/label";
import * as report from "@/lib/report";
import { usePlayerStore } from "@/stores/player";

interface Props {
  playlist: IPlaylist2;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditPlaylistDialog = ({ playlist, open, onOpenChange }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [title, setTitle] = useState(playlist.title);
  const [image, setImage] = useState(playlist.image);
  const [updatePlaylist] = usePlayerStore((state) => [state.updatePlaylist]);

  const handleRename = async () => {
    try {
      const newPlaylist = { ...playlist, title, image };
      await updatePlaylist(newPlaylist);

      toast({
        title: "Playlist saved successfully",
        description: title,
        image,
      });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Playlist save failed",
        description: title,
        image,
      });
      report.error(err as Error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Playlist</AlertDialogTitle>
        </AlertDialogHeader>
        <Label>{t("Name")}</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />

        <Label>Photo</Label>
        <Input
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const imageSrc = `file://${file.path}`;
            setImage(imageSrc);
          }}
          type="file"
          accept="image/*"
        />
        <img alt="" className="h-20" src={image} />

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            {t("Cancel")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleRename}>
            {t("Save")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

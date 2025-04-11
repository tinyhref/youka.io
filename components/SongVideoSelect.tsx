import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { videoTitle } from "@/lib/utils";
import { Label } from "./ui/label";
import { ISongProcessed } from "@/types";
import { useTranslation } from "react-i18next";

interface Props {
  omit?: string[];
  withLabel?: boolean;
  song: ISongProcessed;
  value: string;
  onValueChange: (value: string) => void;
}

export function SongVideoSelectLabel() {
  const { t } = useTranslation();
  return <Label>{t("Video")}</Label>;
}

export function SongVideoSelect({
  song,
  value,
  onValueChange,
  withLabel,
  omit = [],
}: Props) {
  return (
    <div className="flex flex-col space-y-2">
      {withLabel && <SongVideoSelectLabel />}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {song.videos
            .filter((video) => !omit.includes(video.type))
            .map((video) => (
              <SelectItem key={video.id} value={video.id}>
                {videoTitle(video)}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}

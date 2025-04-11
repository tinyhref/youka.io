import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Alignment2Label } from "./Labels";
import { Label } from "./ui/label";
import { ISongProcessed } from "@/types";
import { useTranslation } from "react-i18next";

interface Props {
  omit?: string[];
  withLabel?: boolean;
  song: ISongProcessed;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function SongSubtitlesSelectLabel() {
  const { t } = useTranslation();
  return <Label>{t("Subtitles")}</Label>;
}

export function SongSubtitlesSelect({
  song,
  value,
  onValueChange,
  withLabel,
  omit,
  disabled,
}: Props) {
  return (
    <div className="flex flex-col space-y-2">
      {withLabel && <SongSubtitlesSelectLabel />}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {song.alignments2
            ?.filter((alignment) => !omit?.includes(alignment.modelId))
            .map((alignment) => (
              <SelectItem key={alignment.id} value={alignment.id}>
                <Alignment2Label alignment={alignment} />
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}

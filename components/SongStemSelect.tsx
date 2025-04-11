import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { stem2Label } from "@/lib/utils";
import { Label } from "./ui/label";
import { ISongProcessed } from "@/types";
import { useTranslation } from "react-i18next";

interface Props {
  omit?: string[];
  withLabel?: boolean;
  song: ISongProcessed;
  modelId?: string;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function SongStemSelectLabel() {
  const { t } = useTranslation();
  return <Label>{t("Stem")}</Label>;
}

export function SongStemSelect({
  song,
  value,
  onValueChange,
  withLabel,
  modelId,
  disabled,
}: Props) {
  const stems = modelId
    ? song.stems?.filter((s) => s.modelId === modelId)
    : song.stems;
  return (
    <div className="flex flex-col space-y-2">
      {withLabel && <SongStemSelectLabel />}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {stems.map((stem) => (
            <SelectItem key={stem.id} value={stem.id}>
              {stem2Label(stem)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { SplitModelId2Label } from "./Labels";
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

export function SongStemModelSelectLabel() {
  const { t } = useTranslation();
  return <Label>{t("Audio")}</Label>;
}

export function SongStemModelSelect({
  song,
  value,
  onValueChange,
  withLabel,
  omit = [],
  disabled,
}: Props) {
  const [models, setModels] = useState<string[]>([]);

  useEffect(() => {
    let models = new Set<string>();
    song.stems
      .filter((stem) => !omit.includes(stem.modelId))
      .forEach((stem) => {
        models.add(stem.modelId);
      });
    setModels(Array.from(models));
  }, [song, omit]);

  return (
    <div className="flex flex-col space-y-2">
      {withLabel && <SongStemModelSelectLabel />}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model} value={model}>
              <SplitModelId2Label modelId={model} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

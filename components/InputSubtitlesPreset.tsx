import React from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import { SubtitlesPreset } from "@/types";
import { Label } from "./ui/label";
import { useTranslation } from "react-i18next";

interface InputSubtitlesPresetProps {
  subtitlesPresets: SubtitlesPreset[];
  value: SubtitlesPreset;
  onChange: (value: SubtitlesPreset) => void;
  withLabel?: boolean;
}
export default function InputSubtitlesPreset({
  subtitlesPresets,
  value,
  onChange,
  withLabel,
}: InputSubtitlesPresetProps) {
  const { t } = useTranslation();

  function handleChange(value: string) {
    const preset = subtitlesPresets.find((preset) => preset.id === value);
    if (preset) {
      onChange(preset);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {withLabel && <Label>{t("Subtitles Preset")}</Label>}
      <Select onValueChange={handleChange} value={value.id}>
        <SelectTrigger className="w-[240px]">
          <SelectValue placeholder={t("Subtitles Preset")} />
        </SelectTrigger>
        <SelectContent>
          {subtitlesPresets.map((preset) => (
            <SelectItem key={preset.id} value={preset.id}>
              {preset.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

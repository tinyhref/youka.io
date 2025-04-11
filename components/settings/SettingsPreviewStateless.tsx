import React, { useEffect, useState } from "react";
import { Ass } from "@/lib/ass";
import { SettingsPreview } from "./SettingsPreview";
import {
  Alignment3,
  IStyleOptions,
  Resolution,
  SubtitlesPreset,
} from "@/types";
import { getAss } from "@/lib/ass-alignment";

interface Props {
  alignment: Alignment3;
  styleOptionsMapping: Record<number, IStyleOptions>;
  subtitlesPreset: SubtitlesPreset;
  resolution: Resolution;
  duration?: number;
  color?: string;
}

export function SettingsPreviewStateless({
  alignment,
  subtitlesPreset,
  duration,
  color,
  resolution,
  styleOptionsMapping,
}: Props) {
  const [ass, setAss] = useState<Ass>();

  useEffect(() => {
    const ass = getAss(alignment, subtitlesPreset, {
      styleOptionsMapping,
      rtl: false,
      title: "Song Title",
      artists: ["Some Artist"],
      lang: "en",
      resolution,
    });

    setAss(ass);
  }, [styleOptionsMapping, subtitlesPreset, alignment, resolution]);

  return (
    <SettingsPreview
      ass={ass}
      duration={duration}
      color={color}
      resolution={resolution}
    />
  );
}

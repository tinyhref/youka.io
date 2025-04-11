import React, { useEffect, useState } from "react";
import { Ass } from "@/lib/ass";
import { SettingsPreview } from "./SettingsPreview";
import { getAss } from "@/lib/ass-alignment";
import { Alignment3, SubtitlesPreset } from "@/types";
import { AssPluginRuntime } from "@/lib/ass/plugins/types";

interface Props {
  alignment: Alignment3;
  subtitlesPreset: SubtitlesPreset;
  runtime: AssPluginRuntime;
  duration?: number;
  color?: string;
  style?: string;
  options?: any;
}

export function SettingsPreviewAss({
  alignment,
  subtitlesPreset,
  runtime,
  duration,
  color,
  style,
  options,
}: Props) {
  const [ass, setAss] = useState<Ass>();

  useEffect(() => {
    const ass = getAss(alignment, subtitlesPreset, runtime);

    setAss(ass);
  }, [style, alignment, subtitlesPreset, runtime, options]);

  return (
    <SettingsPreview
      ass={ass}
      duration={duration}
      color={color}
      resolution={runtime.resolution}
    />
  );
}

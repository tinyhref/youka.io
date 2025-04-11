import React from "react";
import { VideoSourceColor } from "@/schemas";
import InputColor from "./InputColor";
import InputResolution from "./InputResolution";

interface VideoInputProps {
  value: VideoSourceColor;
  onChange: (value: VideoSourceColor) => void;
  withAspectRatio?: boolean;
}

export default function InputVideoSourceColor({
  value,
  onChange,
  withAspectRatio,
}: VideoInputProps) {
  return (
    <div className="flex flex-col gap-6">
      <InputColor
        resolution={value.resolution}
        value={value.color}
        onChange={(color) => {
          onChange({ type: "color", color, resolution: value.resolution });
        }}
      />

      {withAspectRatio && (
        <div className="w-[200px]">
          <InputResolution
            withLabel
            value={value.resolution}
            onChange={(resolution) => {
              onChange({ type: "color", color: value.color, resolution });
            }}
          />
        </div>
      )}
    </div>
  );
}

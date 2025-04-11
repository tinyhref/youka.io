import React from "react";
import { ColorPicker } from "./StyleEditor/ColorPicker";
import { Resolution } from "@/types/player";

interface InputColorProps {
  value: string;
  onChange: (value: string) => void;
  resolution: Resolution;
  maxWidth?: number;
  maxHeight?: number;
}

export default function InputColor({
  value,
  onChange,
  resolution,
  maxWidth = 100,
  maxHeight = 100,
}: InputColorProps) {
  const aspectRatio = resolution.width / resolution.height;

  let height, width;

  if (aspectRatio < 1) {
    height = maxHeight;
    width = maxWidth * aspectRatio;
  } else {
    height = maxWidth;
    width = maxHeight * aspectRatio;
  }

  return (
    <div className="flex flex-row">
      <div className="ml-4">
        <ColorPicker color={value} onChange={onChange} />
      </div>

      <div
        className="mt-2 border border-input"
        style={{ backgroundColor: value, width, height }}
      />
    </div>
  );
}

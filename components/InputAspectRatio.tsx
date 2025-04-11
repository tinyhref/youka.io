import React from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import { AspectRatio } from "@/types/player";
import { Label } from "./ui/label";

interface InputAspectRatioProps {
  value: AspectRatio;
  onChange: (value: AspectRatio) => void;
  withLabel?: boolean;
}
export default function InputAspectRatio({
  value,
  onChange,
  withLabel,
}: InputAspectRatioProps) {
  function handleChange(value: string) {
    onChange(stringToAspectRatio(value));
  }

  function stringToAspectRatio(value: string) {
    const [width, height] = value.split(":");
    return { width: parseInt(width), height: parseInt(height) };
  }

  function aspectRatioToString(aspectRatio: AspectRatio) {
    return `${aspectRatio.width}:${aspectRatio.height}`;
  }

  return (
    <div className="flex flex-col gap-2">
      {withLabel && <Label>Aspect Ratio</Label>}
      <Select onValueChange={handleChange} value={aspectRatioToString(value)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Aspect Ratio" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="16:9">16:9</SelectItem>
          <SelectItem value="9:16">9:16</SelectItem>
          <SelectItem value="4:5">4:5</SelectItem>
          <SelectItem value="2:3">2:3</SelectItem>
          <SelectItem value="1:1">1:1</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

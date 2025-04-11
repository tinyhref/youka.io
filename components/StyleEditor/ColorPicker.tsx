import React from "react";
import { HexColorPicker } from "react-colorful";
import { Input } from "@/components/ui/input";

export interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-col my-2 mr-8">
      <HexColorPicker color={color} onChange={onChange} />
      <Input
        className="my-2 w-[200px]"
        type="text"
        value={color}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

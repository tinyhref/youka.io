import React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ColorPicker, ColorPickerProps } from "./ColorPicker";

export function ColorPickerSelect({
  label,
  color,
  onChange,
}: ColorPickerProps & { label: string }) {
  return (
    <Collapsible>
      <CollapsibleTrigger>
        <div className="flex flex-row items-center">
          <div
            style={{ backgroundColor: color }}
            className="m-1 border cursor-pointer rounded w-[24px] h-[24px]"
          />
          <div className="m-1">{label}</div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ColorPicker color={color} onChange={onChange} />
      </CollapsibleContent>
    </Collapsible>
  );
}

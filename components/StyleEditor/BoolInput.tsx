import React from "react";
import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/ui/toggle";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export interface BoolInputProps {
  label: string;
  value: boolean;
  icon: any;
  onChange: (value: boolean) => void;
}

export function BoolInput({ label, value, onChange, icon }: BoolInputProps) {
  return (
    <div className="flex flex-col">
      <Label className="whitespace-nowrap">{label}</Label>
      <Toggle
        variant="outline"
        className="my-2 w-12"
        pressed={value}
        onPressedChange={onChange}
      >
        <FontAwesomeIcon className="h-4 w-4" icon={icon} />
      </Toggle>
    </div>
  );
}

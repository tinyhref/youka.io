import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SelectInputProps {
  label?: string;
  value: string;
  values: Record<string, string>;
  onChange: (value: string) => void;
}

export function SelectInput({
  label,
  value,
  values,
  onChange,
}: SelectInputProps) {
  return (
    <div className="flex flex-col">
      {label && <Label className="whitespace-nowrap">{label}</Label>}
      <Select value={value} onValueChange={(value) => onChange(value)}>
        <SelectTrigger className="mt-2">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(values).map(([key, value]) => {
            return (
              <SelectItem key={key} value={value}>
                {key}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

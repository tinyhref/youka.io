import React from "react";
import { SelectInput } from "@/components/StyleEditor/SelectInput";

interface AlignmentSelectInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}

export function AlignmentSelectInput({
  value,
  onChange,
  label,
}: AlignmentSelectInputProps) {
  return (
    <SelectInput
      label={label}
      value={value.toString()}
      values={{
        "Bottom Left": "1",
        "Bottom Center": "2",
        "Bottom Right": "3",
        "Middle Left": "4",
        "Middle Center": "5",
        "Middle Right": "6",
        "Top Left": "7",
        "Top Center": "8",
        "Top Right": "9",
      }}
      onChange={(value) => onChange(parseInt(value))}
    />
  );
}

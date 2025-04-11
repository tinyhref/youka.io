import React from "react";
import { SelectInput } from "@/components/StyleEditor/SelectInput";

interface BorderStyleSelectInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export function BorderStyleSelectInput({
  label,
  value,
  onChange,
}: BorderStyleSelectInputProps) {
  return (
    <SelectInput
      label={label}
      value={value.toString()}
      values={{
        Outline: "1",
        "Opaque Box": "3",
      }}
      onChange={(value) => onChange(parseInt(value))}
    />
  );
}

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export interface NumberInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
}

export function NumberInput({
  label,
  value,
  onValueChange,
  ...props
}: NumberInputProps) {
  return (
    <div className="flex flex-col">
      <Label>{label}</Label>
      <Input
        {...props}
        className="w-[100px] my-2"
        type="number"
        value={value}
        onChange={(e) => onValueChange(parseInt(e.target.value))}
      />
    </div>
  );
}

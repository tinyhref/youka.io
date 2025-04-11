import React from "react";
import { Input } from "@/components/ui/input";
import { SettingsItemContainer } from "../SettingsItemContainer";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  title: string;
  tooltip?: string;
  onValueChange: (value: number) => void;
}

export function SettingInputNumber({
  title,
  tooltip,
  value,
  onValueChange,
  ...props
}: Props) {
  return (
    <SettingsItemContainer title={title} tooltip={tooltip}>
      <div className="w-40">
        <Input
          type="number"
          value={value}
          onChange={(e) => onValueChange(Number(e.target.value))}
          {...props}
        />
      </div>
    </SettingsItemContainer>
  );
}

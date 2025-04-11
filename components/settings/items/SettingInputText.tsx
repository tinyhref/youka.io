import React from "react";
import { Input } from "@/components/ui/input";
import { SettingsItemContainer } from "../SettingsItemContainer";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  title: string;
  tooltip?: string;
  onValueChange: (value: string) => void;
}

export function SettingInputText({
  title,
  tooltip,
  value,
  onValueChange,
}: Props) {
  return (
    <SettingsItemContainer title={title} tooltip={tooltip}>
      <div className="w-40">
        <Input
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
        />
      </div>
    </SettingsItemContainer>
  );
}

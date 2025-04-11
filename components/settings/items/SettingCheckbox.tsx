import React from "react";
import { SettingsItemContainer } from "../SettingsItemContainer";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  title: string;
  tooltip?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function SettingCheckbox({ title, tooltip, value, onChange }: Props) {
  return (
    <SettingsItemContainer title={title} tooltip={tooltip}>
      <Checkbox checked={value} onCheckedChange={(e) => onChange(Boolean(e))} />
    </SettingsItemContainer>
  );
}

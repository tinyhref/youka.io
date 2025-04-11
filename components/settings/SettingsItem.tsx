import * as React from "react";
import { Items } from "./items";

interface SettingsItemProps {
  settingsKey: string;
}

export function SettingsItem({ settingsKey }: SettingsItemProps) {
  const e = Items.find((item) => item.key === settingsKey);
  if (!e) return null;
  return <e.Comp />;
}

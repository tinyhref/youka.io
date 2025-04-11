import React from "react";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "@/stores/settings";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { AutoStyleName } from "@/consts";

export function StyleSelect({
  value,
  onChange,
  withLabel,
  withAuto,
}: {
  value: string;
  onChange: (value: string) => void;
  withLabel?: boolean;
  withAuto?: boolean;
}) {
  const { t } = useTranslation();
  const [styles] = useSettingsStore((state) => [state.styles]);
  return (
    <div className="flex flex-col gap-2">
      {withLabel && <Label>{t("Style")}</Label>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select a style" />
        </SelectTrigger>
        <SelectContent>
          {withAuto && (
            <SelectItem key={AutoStyleName} value={AutoStyleName}>
              {t("Auto")}
            </SelectItem>
          )}
          {styles.map((style) => (
            <SelectItem key={style.name} value={style.name}>
              {style.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

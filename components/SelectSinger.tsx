import React from "react";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useTranslation } from "react-i18next";
import { ALL_SINGERS_ID } from "@/consts";

interface SelectSingerProps {
  value?: number;
  onChange: (value?: number) => void;
  withLabel?: boolean;
  singers: number[];
}

export default function SelectSinger({
  value,
  onChange,
  singers,
  withLabel,
}: SelectSingerProps) {
  const { t } = useTranslation();

  function renderSinger(singer: number) {
    if (singer === ALL_SINGERS_ID) {
      return t("All");
    }

    return t("Singer") + " " + (singer + 1);
  }

  return (
    <div className="flex flex-col gap-2">
      {withLabel && <Label>{t("Singer")}</Label>}

      <div className="flex flex-col gap-4">
        <Select
          value={value !== undefined ? value.toString() : ""}
          onValueChange={(value) =>
            onChange(value === "" ? undefined : Number(value))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem key={"all"} value={""}>
              {t("No Filter")}
            </SelectItem>
            {singers.map((singer) => (
              <SelectItem key={singer} value={singer.toString()}>
                {renderSinger(singer)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

import React from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import { Label } from "./ui/label";
import { AssRendererType } from "@/types/subtitles";
import { useTranslation } from "react-i18next";

interface InputAssRendererProps {
  value: AssRendererType;
  onChange: (value: AssRendererType) => void;
  withLabel?: boolean;
}

export default function InputAssRenderer({
  value,
  onChange,
  withLabel,
}: InputAssRendererProps) {
  const { t } = useTranslation();

  function handleChange(value: string) {
    onChange(value as AssRendererType);
  }

  return (
    <div className="flex flex-col gap-2">
      {withLabel && <Label>Subtitles Renderer</Label>}
      <Select onValueChange={handleChange} value={value}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Subtitles Renderer" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ass2">
            {t("2 Lines")} - {t("Dynamic")}
          </SelectItem>
          <SelectItem value="ass3">
            {t("2 Lines")} - {t("Static")}
          </SelectItem>
          <SelectItem value="ass4">{t("4 Lines")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

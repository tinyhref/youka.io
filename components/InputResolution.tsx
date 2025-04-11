import React from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import { AspectRatio, Resolution } from "@/types/player";
import { Label } from "./ui/label";
import { useTranslation } from "react-i18next";
interface InputResolutionProps {
  value: Resolution;
  onChange: (value: Resolution) => void;
  withLabel?: boolean;
}
export default function InputResolution({
  value,
  onChange,
  withLabel,
}: InputResolutionProps) {
  const { t } = useTranslation();

  function handleChange(value: string) {
    onChange(stringToResolution(value));
  }

  function stringToResolution(value: string) {
    const [width, height] = value.split("x");
    return { width: parseInt(width), height: parseInt(height) };
  }

  function resolutionToString(resolution: Resolution) {
    return `${resolution.width}x${resolution.height}`;
  }

  return (
    <div className="flex flex-col gap-2">
      {withLabel && <Label>{t("Resolution")}</Label>}
      <Select onValueChange={handleChange} value={resolutionToString(value)}>
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Resolution" />
        </SelectTrigger>
        <SelectContent>
          {/*  Horizontal 16:9 (YouTube, Facebook, Instagram) */}
          <SelectItem value="1920x1080">
            <ResolutionItem
              shape={t("Horizontal")}
              resolution={{ width: 1920, height: 1080 }}
              aspectRatio={{ width: 16, height: 9 }}
            />
          </SelectItem>
          {/*  Vertical 9:16 (TikTok) */}
          <SelectItem value="1080x1920">
            <ResolutionItem
              shape={t("Vertical")}
              resolution={{ width: 1080, height: 1920 }}
              aspectRatio={{ width: 9, height: 16 }}
            />
          </SelectItem>
          {/* Vertical 1080x1350 (Instagram Feed, Facebook) */}
          <SelectItem value="1080x1350">
            <ResolutionItem
              shape={t("Vertical")}
              resolution={{ width: 1080, height: 1350 }}
              aspectRatio={{ width: 4, height: 5 }}
            />
          </SelectItem>
          {/* Vertical 1080x1620 */}
          <SelectItem value="1080x1620">
            <ResolutionItem
              shape={t("Vertical")}
              resolution={{ width: 1080, height: 1620 }}
              aspectRatio={{ width: 2, height: 3 }}
            />
          </SelectItem>
          {/* Square 1080x1080 (Instagram Feed, Facebook Feed) */}
          <SelectItem value="1080x1080">
            <ResolutionItem
              shape={t("Square")}
              resolution={{ width: 1080, height: 1080 }}
              aspectRatio={{ width: 1, height: 1 }}
            />
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function ResolutionItem({
  shape,
  resolution,
  aspectRatio,
}: {
  shape: string;
  resolution: Resolution;
  aspectRatio: AspectRatio;
}) {
  return (
    <div>
      {shape} - {resolution.width}x{resolution.height} ({aspectRatio.width}:
      {aspectRatio.height})
    </div>
  );
}

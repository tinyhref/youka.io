import React from "react";
import { FFmpegTransitionOptions, FFmpegTransitionType } from "@/types";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { useTranslation } from "react-i18next";

interface InputFFmpegTransitionProps {
  value: FFmpegTransitionOptions;
  onChange: (value: FFmpegTransitionOptions) => void;
  withLabel?: boolean;
}

export const DefaultFFmpegTransitionOptions: FFmpegTransitionOptions = {
  type: "fade",
  duration: 1,
  offset: 0,
};

const transitions = [
  { type: "fade", label: "Fade" },
  { type: "circleopen", label: "Circle Open" },
  { type: "circleclose", label: "Circle Close" },
  { type: "diagonalopen", label: "Diagonal Open" },
  { type: "diagonalclose", label: "Diagonal Close" },
  { type: "smoothleft", label: "Smooth Left" },
  { type: "smoothright", label: "Smooth Right" },
  { type: "squares", label: "Squares" },
  { type: "dissolve", label: "Dissolve" },
] as const;

export default function InputFFmpegTransition({
  value,
  onChange,
  withLabel,
}: InputFFmpegTransitionProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      {withLabel && <Label>{t("Transition")}</Label>}

      <div className="flex flex-col gap-4">
        <Label>{t("Type")}</Label>
        <Select
          value={value.type}
          onValueChange={(type) =>
            onChange({ ...value, type: type as FFmpegTransitionType })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a transition" />
          </SelectTrigger>
          <SelectContent>
            {transitions.map((transition) => (
              <SelectItem key={transition.type} value={transition.type}>
                {t(`${transition.label}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Label>
          {t("Duration")} ({t("Seconds")})
        </Label>
        <Input
          type="number"
          value={value.duration}
          onChange={(e) =>
            onChange({ ...value, duration: e.target.valueAsNumber })
          }
        />

        <Label>
          {t("Offset")} ({t("Seconds")})
        </Label>
        <Input
          type="number"
          value={value.offset}
          onChange={(e) =>
            onChange({ ...value, offset: e.target.valueAsNumber })
          }
        />
      </div>
    </div>
  );
}

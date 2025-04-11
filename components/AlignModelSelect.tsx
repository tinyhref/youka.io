import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "./ui/label";
import { useTranslation } from "react-i18next";

export function AlignModelLabel() {
  const { t } = useTranslation();

  return <Label>{t("Sync Model")}</Label>;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  withLabel?: boolean;
}
export function AlignModelSelect({ value, onChange, withLabel = true }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      {withLabel && <AlignModelLabel />}
      <Select value={value} onValueChange={(value) => onChange(value)}>
        <SelectTrigger className="max-w-[180px]">
          <SelectValue />
          <SelectContent>
            <SelectItem value="auto">{t("Auto")}</SelectItem>
            <SelectItem value="audioshake-transcription">
              AudioShakeAI ({t("Transcription")})
            </SelectItem>
            <SelectItem value="audioshake-alignment">
              AudioShakeAI ({t("Alignment")})
            </SelectItem>
            <SelectItem value="wav2vec2">Wav2Vec2 ({t("Legacy")})</SelectItem>
            <SelectItem value="whisper">
              Whisper ({t("Transcription")})
            </SelectItem>
          </SelectContent>
        </SelectTrigger>
      </Select>
    </div>
  );
}

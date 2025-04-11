import React from "react";
import { useTranslation } from "react-i18next";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { SubtitlesSource, SubtitlesSourceType } from "@/schemas";
import InputSubtitlesSourceLrc from "./InputSubtitlesSourceLrc";

interface InputSubtitlesSourceProps {
  value: SubtitlesSource;
  onChange: (value: SubtitlesSource) => void;
}
export default function InputVideoSource({
  value,
  onChange,
}: InputSubtitlesSourceProps) {
  const { t } = useTranslation();

  function render() {
    switch (value.type) {
      case "auto":
        return null;

      case "lrc":
        return <InputSubtitlesSourceLrc value={value} onChange={onChange} />;
    }
  }

  function handleChangeMode(value: SubtitlesSourceType) {
    switch (value) {
      case "lrc":
        onChange({
          type: "lrc",
          filepath: "",
        });
        break;
      case "auto":
        onChange({ type: "auto" });
        break;
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row items-center h-10 gap-2">
        <RadioGroup
          value={value.type}
          onValueChange={(value) =>
            handleChangeMode(value as SubtitlesSourceType)
          }
          className="flex flex-row items-center gap-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="auto" id="subtitles-source-auto" />
            <Label htmlFor="subtitles-source-auto">{t("Auto")}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="lrc" id="subtitles-source-lrc" />
            <Label htmlFor="subtitles-source-lrc">LRC</Label>
          </div>
        </RadioGroup>
      </div>
      {render()}
    </div>
  );
}

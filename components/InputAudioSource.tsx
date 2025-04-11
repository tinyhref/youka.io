import React from "react";
import { useTranslation } from "react-i18next";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { AudioSource, AudioSourceType } from "@/schemas";
import InputAudioSourceUrl from "./InputAudioSourceUrl";
import InputAudioSourceVideo from "./InputAudioSourceVideo";
import InputAudioSourceAudio from "./InputAudioSourceAudio";
import {
  DefaultAudioSourceAudio,
  DefaultAudioSourceKarafun,
  DefaultAudioSourceUrl,
  DefaultAudioSourceVideo,
} from "@/consts";
import InputAudioSourceKarafun from "./InputAudioSourceKarafun";

interface InputAudioSourceProps {
  value: AudioSource;
  onChange: (value: AudioSource) => void;
  withVideo?: boolean;
  withAudio?: boolean;
  withUrl?: boolean;
  withKarafun?: boolean;
}
export default function InputAudioSource({
  value,
  onChange,
  withVideo,
  withAudio,
  withUrl,
  withKarafun,
}: InputAudioSourceProps) {
  const { t } = useTranslation();

  function render() {
    switch (value.type) {
      case "video":
        return <InputAudioSourceVideo value={value} onChange={onChange} />;

      case "audio":
        return <InputAudioSourceAudio value={value} onChange={onChange} />;

      case "url":
        return <InputAudioSourceUrl value={value} onChange={onChange} />;

      case "karafun":
        return <InputAudioSourceKarafun value={value} onChange={onChange} />;
    }
  }

  function handleChangeMode(value: AudioSourceType) {
    switch (value) {
      case "video":
        onChange(DefaultAudioSourceVideo);
        break;
      case "audio":
        onChange(DefaultAudioSourceAudio);
        break;
      case "url":
        onChange(DefaultAudioSourceUrl);
        break;
      case "karafun":
        onChange(DefaultAudioSourceKarafun);
        break;
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row items-center h-10 gap-2">
        <RadioGroup
          value={value.type}
          onValueChange={(value) => handleChangeMode(value as AudioSourceType)}
          className="flex flex-row items-center gap-x-4"
        >
          {withAudio && (
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="audio" id="audio-source-audio" />
              <Label htmlFor="audio-source-audio">{t("Audio")}</Label>
            </div>
          )}
          {withVideo && (
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="video" id="audio-source-video" />
              <Label htmlFor="audio-source-video">{t("Video")}</Label>
            </div>
          )}
          {withUrl && (
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="url" id="audio-source-url" />
              <Label htmlFor="audio-source-url">URL</Label>
            </div>
          )}
          {withKarafun && (
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="karafun" id="audio-source-karafun" />
              <Label htmlFor="audio-source-karafun">Karafun</Label>
            </div>
          )}
        </RadioGroup>
      </div>
      {render()}
    </div>
  );
}

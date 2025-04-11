import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { VideoSource, VideoSourceType } from "@/schemas";
import InputVideoSourceVideo from "./InputVideoSourceVideo";
import { Button } from "./ui/button";
import {
  AspectRatio16x9,
  DefaultVideoSource,
  DEFAULT_BACKGROUND_IMAGE_URL,
} from "@/consts";
import InputVideoSourceImage from "./InputVideoSourceImage";
import InputVideoSourceColor from "./InputVideoSourceColor";

interface InputVideoSourceProps {
  value: VideoSource;
  onChange: (value: VideoSource) => void;
  setAsDefault?: (value: VideoSource) => void;
  withAuto?: boolean;
  withAspectRatio?: boolean;
}
export default function InputVideoSource({
  value,
  onChange,
  setAsDefault,
  withAuto,
  withAspectRatio,
}: InputVideoSourceProps) {
  const { t } = useTranslation();
  const [hasSetAsDefault, setHasSetAsDefault] = useState(false);

  function handleSetAsDefault() {
    if (setAsDefault) {
      setAsDefault(value);
      setHasSetAsDefault(true);
      setTimeout(() => {
        setHasSetAsDefault(false);
      }, 1000);
    }
  }

  function render() {
    switch (value.type) {
      case "auto":
        return null;

      case "video":
        return (
          <InputVideoSourceVideo
            value={value}
            onChange={onChange}
            withAspectRatio={withAspectRatio}
          />
        );

      case "image":
        return (
          <InputVideoSourceImage
            value={value}
            onChange={onChange}
            withAspectRatio={withAspectRatio}
          />
        );

      case "color":
        return (
          <InputVideoSourceColor
            value={value}
            onChange={onChange}
            withAspectRatio={withAspectRatio}
          />
        );

      case "url":
        return null;
    }
  }

  function handleChangeMode(value: VideoSourceType) {
    switch (value) {
      case "video":
        onChange({
          type: "video",
          filepath: "",
          id: "",
          duration: 0,
          title: "",
          aspectRatio: AspectRatio16x9,
        });
        break;
      case "image":
        onChange({
          type: "image",
          url: DEFAULT_BACKGROUND_IMAGE_URL,
          size: 0,
          aspectRatio: AspectRatio16x9,
        });
        break;
      case "color":
        onChange({
          type: "color",
          color: "#000000",
          resolution: { width: 1920, height: 1080 },
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
          onValueChange={(value) => handleChangeMode(value as VideoSourceType)}
          className="flex flex-row items-center gap-x-4"
        >
          {withAuto && (
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="auto" id="video-source-auto" />
              <Label htmlFor="video-source-auto">{t("Auto")}</Label>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="video" id="video-source-video" />
            <Label htmlFor="video-source-video">{t("Video")}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="image" id="video-source-image" />
            <Label htmlFor="video-source-image">{t("Image")}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="color" id="video-source-color" />
            <Label htmlFor="video-source-color">{t("Color")}</Label>
          </div>
        </RadioGroup>
      </div>
      {render()}

      {setAsDefault && (
        <div className="flex flex-row gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              handleSetAsDefault();
            }}
            disabled={hasSetAsDefault}
          >
            {hasSetAsDefault ? "Saved" : t("Set as Default")}
          </Button>

          {value.type !== "auto" && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAsDefault(DefaultVideoSource);
                onChange(DefaultVideoSource);
              }}
            >
              {t("Reset")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

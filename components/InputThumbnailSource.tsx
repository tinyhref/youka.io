import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { ThumbnailSource, ThumbnailSourceType } from "@/schemas";
import InputImage from "./InputImage";
import { Button } from "./ui/button";
import { DefaultThumbnailSource, DEFAULT_BACKGROUND_IMAGE_URL } from "@/consts";

interface InputThumbnailSourceProps {
  value: ThumbnailSource;
  onChange: (value: ThumbnailSource) => void;
  setAsDefault: (value: ThumbnailSource) => void;
}
export default function InputThumbnailSource({
  value,
  onChange,
  setAsDefault,
}: InputThumbnailSourceProps) {
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

      case "image":
        return (
          <InputImage
            value={value.url}
            onChange={(url) => {
              onChange({ type: "image", url });
            }}
          />
        );
    }
  }

  function handleChangeMode(value: ThumbnailSourceType) {
    switch (value) {
      case "image":
        onChange({ type: "image", url: DEFAULT_BACKGROUND_IMAGE_URL });
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
            handleChangeMode(value as ThumbnailSourceType)
          }
          className="flex flex-row items-center gap-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="auto" id="thumbnail-source-auto" />
            <Label htmlFor="thumbnail-source-auto">{t("Auto")}</Label>
          </div>

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="image" id="thumbnail-source-image" />
            <Label htmlFor="thumbnail-source-image">{t("Image")}</Label>
          </div>
        </RadioGroup>
      </div>
      {render()}
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
              setAsDefault(DefaultThumbnailSource);
              onChange(DefaultThumbnailSource);
            }}
          >
            {t("Reset")}
          </Button>
        )}
      </div>
    </div>
  );
}

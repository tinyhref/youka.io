import React from "react";
import { VideoSourceImage } from "@/schemas";
import InputFileLabel from "./InputFileLabel";
import { AspectRatio } from "./ui/aspect-ratio";
import InputAspectRatio from "./InputAspectRatio";

interface VideoInputProps {
  value: VideoSourceImage;
  onChange: (value: VideoSourceImage) => void;
  withAspectRatio?: boolean;
}

export default function InputVideoSourceImage({
  value,
  onChange,
  withAspectRatio,
}: VideoInputProps) {
  async function handleChange(file: File) {
    const filepath = file.path;
    const url = `file://${filepath}`;
    const size = file.size;

    onChange({ type: "image", url, size, aspectRatio: value.aspectRatio });
  }

  return (
    <div className="flex flex-col gap-6">
      <InputFileLabel
        filepath={value.url}
        onChangePromise={handleChange}
        type="file"
        accept="image/*"
      />

      {withAspectRatio && (
        <InputAspectRatio
          withLabel
          value={value.aspectRatio}
          onChange={(aspectRatio) => {
            onChange({ ...value, aspectRatio });
          }}
        />
      )}

      <div className="w-40">
        <AspectRatio ratio={value.aspectRatio.width / value.aspectRatio.height}>
          <img
            alt=""
            className="object-contain w-full h-full border border-input"
            src={value.url}
          />
        </AspectRatio>
      </div>
    </div>
  );
}

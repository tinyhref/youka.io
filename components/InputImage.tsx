import React from "react";
import { AspectRatio } from "./ui/aspect-ratio";
import InputFileLabel from "./InputFileLabel";

interface ImageInputProps {
  value: string;
  onChange: (url: string) => void;
}

export default function InputImage({ value, onChange }: ImageInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <InputFileLabel
        filepath={value}
        onChangePromise={async (file) => {
          const imageURL = `file://${file.path}`;
          onChange(imageURL);
        }}
        type="file"
        accept="image/*"
      />

      <div className="w-40">
        <AspectRatio ratio={16 / 9}>
          <img
            alt=""
            className="object-cover w-full h-full border border-input"
            src={value}
          />
        </AspectRatio>
      </div>
    </div>
  );
}

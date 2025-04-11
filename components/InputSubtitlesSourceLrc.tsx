import React from "react";
import { SubtitlesSourceLrc } from "@/schemas";
import InputFileLabel from "./InputFileLabel";

interface SubtitlesInputProps {
  value: SubtitlesSourceLrc;
  onChange: (value: SubtitlesSourceLrc) => void;
}

export default function InputSubtitlesSourceLrc({
  value,
  onChange,
}: SubtitlesInputProps) {
  async function handleChange(file: File) {
    const filepath = file.path;
    onChange({ type: "lrc", filepath });
  }

  return (
    <InputFileLabel
      filepath={value.filepath}
      onChangePromise={handleChange}
      type="file"
      accept=".lrc"
    />
  );
}

import React from "react";
import { getFileDuration, getFileId } from "../lib/library";
import path from "path";
import { AudioSourceAudio } from "@/schemas";
import InputFileLabel from "./InputFileLabel";

interface AudioInputProps {
  value: AudioSourceAudio;
  onChange: (value: AudioSourceAudio) => void;
}

export default function InputAudioSourceAudio({
  value,
  onChange,
}: AudioInputProps) {
  async function handleChange(file: File) {
    const [id, duration] = await Promise.all([
      getFileId(file.path),
      getFileDuration(file.path),
    ]);
    const filepath = file.path;
    const title = path.parse(file.name).name;
    onChange({ type: "audio", filepath, id, duration, title });
  }

  return (
    <InputFileLabel
      filepath={value.filepath}
      onChangePromise={handleChange}
      type="file"
      accept="audio/*"
    />
  );
}

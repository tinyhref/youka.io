import React from "react";
import { getFileId, getFileDuration } from "@/lib/library";
import path from "path";
import { AudioSourceVideo } from "@/schemas";
import InputFileLabel from "./InputFileLabel";

interface AudioInputProps {
  value: AudioSourceVideo;
  onChange: (value: AudioSourceVideo) => void;
}

export default function InputAudioSourceVideo({
  value,
  onChange,
}: AudioInputProps) {
  async function handleChange(file: File) {
    const [id, duration] = await Promise.all([
      getFileId(file.path),
      getFileDuration(file.path),
    ]);
    const title = path.parse(file.name).name;
    const filepath = file.path;
    onChange({ type: "video", filepath, id, duration, title });
  }

  return (
    <InputFileLabel
      filepath={value.filepath}
      onChangePromise={handleChange}
      type="file"
      accept="video/*,.mkv"
    />
  );
}

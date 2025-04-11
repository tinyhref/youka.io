import React from "react";
import { getFileId } from "../lib/library";
import { AudioSourceKarafun } from "@/schemas";
import InputFileLabel from "./InputFileLabel";
import { extractLockedKFN, KarafunFile } from "@/lib/karafun";
import ffprobe from "@/lib/binary/ffprobe";
import path from "path";

interface AudioInputProps {
  value: AudioSourceKarafun;
  onChange: (value: AudioSourceKarafun) => void;
}

export default function InputAudioSourceKarafun({
  value,
  onChange,
}: AudioInputProps) {
  async function handleChange(file: File) {
    const id = await getFileId(file.path);
    const extractResult = await extractLockedKFN(file.path);

    const karafunFile = extractResult.files.find(
      (f) => f.type === "audio"
    ) as KarafunFile;

    if (!karafunFile) throw new Error("failed to parse karafun file");

    const duration = await ffprobe.duration(karafunFile.filepath);
    const title = path.parse(file.name).name;
    const filepath = file.path;
    onChange({ type: "karafun", filepath, id, duration, title, extractResult });
  }

  return (
    <InputFileLabel
      filepath={value.filepath}
      onChangePromise={handleChange}
      type="file"
      accept=".kfn"
    />
  );
}

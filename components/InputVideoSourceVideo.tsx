import React from "react";
import { getFileId, getFileDuration } from "@/lib/library";
import path from "path";
import { VideoSourceVideo } from "@/schemas";
import InputFileLabel from "./InputFileLabel";
import InputAspectRatio from "./InputAspectRatio";

interface VideoInputProps {
  value: VideoSourceVideo;
  onChange: (value: VideoSourceVideo) => void;
  withAspectRatio?: boolean;
}

export default function InputVideoSourceVideo({
  value,
  onChange,
  withAspectRatio,
}: VideoInputProps) {
  async function handleChange(file: File) {
    const [id, duration] = await Promise.all([
      getFileId(file.path),
      getFileDuration(file.path),
    ]);
    const title = path.parse(file.name).name;
    const filepath = file.path;
    onChange({
      type: "video",
      filepath,
      id,
      duration,
      title,
      aspectRatio: value.aspectRatio,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <InputFileLabel
        filepath={value.filepath}
        onChangePromise={handleChange}
        type="file"
        accept="video/*,.mkv"
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
    </div>
  );
}

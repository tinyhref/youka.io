import React from "react";
import { ListItemJobExport } from "./ListItemJobExport";
import { ListItemJobGenerate } from "./ListItemJobGenerate";
import { ListItemJobGeneric } from "./ListItemJobGeneric";
import { JobStateUnion } from "@/types";

interface Props {
  job: JobStateUnion;
}

export function ListItemJob({ job }: Props) {
  switch (job.type) {
    case "export-media":
      return <ListItemJobExport job={job} />;
    case "create-karaoke":
    case "sync-lyrics":
    case "change-background":
    case "trim":
    case "add-karaoke-intro":
    case "split":
    case "import-subtitles":
    case "import-karaoke":
    case "resize-video":
    case "import-stem":
      return <ListItemJobGenerate job={job} />;
    default:
      return <ListItemJobGeneric job={job} />;
  }
}

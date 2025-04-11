import React from "react";
import { useTranslation } from "react-i18next";
import electron from "electron";
import { IJobStateExportMedia } from "@/types";
import { SongItem } from "./SongItem";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface Props {
  job: IJobStateExportMedia;
}

export function ListItemJobExport({ job }: Props) {
  const { t } = useTranslation();

  function handleClickOpen(filepath: string) {
    electron.ipcRenderer.send("showItemInFolder", filepath);
  }

  return (
    <SongItem
      song={job.input.song}
      job={job}
      variant="notification"
      // @ts-ignore
      subtitle={`${t(job.name)} [${job.input.fileType}]`}
    >
      {job.output?.filepath && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              onClick={() =>
                job.output?.filepath && handleClickOpen(job.output?.filepath)
              }
            >
              {t("Show")}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>{job.output?.filepath}</span>
          </TooltipContent>
        </Tooltip>
      )}
    </SongItem>
  );
}

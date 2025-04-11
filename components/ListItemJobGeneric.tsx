import React from "react";
import { useTranslation } from "react-i18next";
import { IJobStateParseTitles, IJobStateAnalyseLibrary } from "@/types";
import { JobStatus } from "./JobStatus";
import { faGear, faMinusCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { usePlayerStore } from "@/stores/player";

interface Props {
  job: IJobStateParseTitles | IJobStateAnalyseLibrary;
}

export function ListItemJobGeneric({ job }: Props) {
  const { t } = useTranslation();
  const cancelJob = usePlayerStore((state) => state.cancelJob);

  function handleCancelJob() {
    if (!job) return;
    cancelJob(job.id);
  }

  return (
    <div className="flex flex-row w-full justify-between p-4 hover:bg-slate-100 dark:hover:bg-muted cursor-pointer">
      <div className="flex flex-row gap-4">
        <div>
          <FontAwesomeIcon icon={faGear} />
        </div>
        <div>{job.name}</div>
      </div>
      <div className="flex flex-row">
        <JobStatus job={job} showProgressOutside />
        {job.status === "running" && (
          <div className="ml-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <FontAwesomeIcon
                  color="#e63946"
                  onClick={handleCancelJob}
                  icon={faMinusCircle}
                />
              </TooltipTrigger>
              <TooltipContent>{t("Cancel")}</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
}

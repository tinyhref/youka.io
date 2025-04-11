import React from "react";
import { useTranslation } from "react-i18next";
import { JobStateUnion } from "@/types";
import {
  FontAwesomeIcon,
  FontAwesomeIconProps,
} from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faCircleRight,
  faCircleXmark,
  faExclamationCircle,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { LoaderProgress } from "./ui/LoaderProgress";
import { usePlayerStore } from "@/stores/player";

interface Props extends Omit<FontAwesomeIconProps, "icon"> {
  job?: JobStateUnion;
  showProgressOutside?: boolean;
}

export function JobStatus({ job, showProgressOutside, ...props }: Props) {
  const { t } = useTranslation();
  const [redoJob] = usePlayerStore((state) => [state.redoJob]);

  function handleRedo() {
    if (!job) return;
    redoJob(job.id);
  }

  if (!job) return null;

  switch (job.status) {
    case "done":
      return (
        <Tooltip>
          <TooltipTrigger>
            <FontAwesomeIcon color="#588157" icon={faCheckCircle} {...props} />
          </TooltipTrigger>
          <TooltipContent>{t("Ready")}</TooltipContent>
        </Tooltip>
      );

    case "error":
      return (
        <div className="flex flex-row items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <FontAwesomeIcon
                className="cursor-pointer"
                onClick={handleRedo}
                icon={faCircleRight}
              />
            </TooltipTrigger>
            <TooltipContent>{t("Retry")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <FontAwesomeIcon
                color="#e63946"
                icon={faExclamationCircle}
                {...props}
              />
            </TooltipTrigger>
            <TooltipContent>
              {job.error || t("An unknown error occurred")}
            </TooltipContent>
          </Tooltip>
        </div>
      );

    case "pending":
      return (
        <Tooltip>
          <TooltipTrigger>
            <FontAwesomeIcon icon={faSpinner} beat {...props} />
          </TooltipTrigger>
          <TooltipContent>{t("Waiting in queue")}</TooltipContent>
        </Tooltip>
      );

    case "running":
      return showProgressOutside ? (
        <div className="flex flex-row items-center">
          <div className="mx-2 w-[30px] text-xs">{job.progress}%</div>
          <FontAwesomeIcon icon={faSpinner} spin {...props} />
        </div>
      ) : (
        <LoaderProgress
          color="white"
          className="w-[200px]"
          value={[job.progress]}
        />
      );

    case "aborting":
      return (
        <Tooltip>
          <TooltipTrigger>
            <FontAwesomeIcon
              color="#e63946"
              fade
              icon={faCircleXmark}
              {...props}
            />
          </TooltipTrigger>
          <TooltipContent>{t("Canceling")}</TooltipContent>
        </Tooltip>
      );

    case "aborted":
      return (
        <div className="flex flex-row items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <FontAwesomeIcon onClick={handleRedo} icon={faCircleRight} />
            </TooltipTrigger>
            <TooltipContent>{t("Retry")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <FontAwesomeIcon
                color="#e63946"
                icon={faCircleXmark}
                {...props}
              />
            </TooltipTrigger>
            <TooltipContent>
              <TooltipContent>{t("Canceled")}</TooltipContent>
            </TooltipContent>
          </Tooltip>
        </div>
      );

    default:
      return null;
  }
}

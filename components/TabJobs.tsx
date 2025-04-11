import React, { useEffect, useState } from "react";
import { usePlayerStore } from "@/stores/player";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faListOl } from "@fortawesome/free-solid-svg-icons";
import { ListItemJob } from "./ListItemJob";
import { JobStateUnion } from "@/types";
import { useTranslation } from "react-i18next";

export default function TabJobs() {
  const [jobsRecord] = usePlayerStore((state) => [state.jobs]);
  const [jobs, setJobs] = useState<JobStateUnion[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    const jobs = Object.values(jobsRecord)
      .sort((a, b) => a.created - b.created)
      .reverse();

    setJobs(jobs);
  }, [jobsRecord]);

  return (
    <div className="h-[85vh] overflow-y-auto overflow-x-hidden grow-1 rounded-md border">
      {jobs.length === 0 ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-muted">
          <FontAwesomeIcon icon={faListOl} size="4x" />
          <div className="p-2">{t("No Jobs")}</div>
        </div>
      ) : (
        <>
          {jobs.map((job) => (
            <div key={job.id} className="flex flex-col items-center w-full">
              <ListItemJob job={job} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TabLibrary from "@/components/TabLibrary";
import TabQueue from "@/components/TabQueue";
import TabJobs from "@/components/TabJobs";
import { usePlayerStore } from "@/stores/player";
import { TabType } from "@/types";

export const PlayerSidebar = () => {
  const { t } = useTranslation();
  const [tab, setTab, queue, jobs] = usePlayerStore((state) => [
    state.tab,
    state.setTab,
    state.queue,
    state.jobs,
  ]);
  const [runningJobs, setRunningJobs] = useState<number>(0);

  useEffect(() => {
    const runningJobs = Object.values(jobs).filter(
      (job) => job.status === "running"
    ).length;
    setRunningJobs(runningJobs);
  }, [jobs]);

  const width = "w-1/3";
  return (
    <Tabs value={tab} onValueChange={(tab: string) => setTab(tab as TabType)}>
      <TabsList className="w-full">
        <TabsTrigger className={width} value="queue">
          {t("Queue")}
          {queue.length > 0 && <span className="ml-1">({queue.length})</span>}
        </TabsTrigger>
        <TabsTrigger className={width} value="jobs">
          {t("Jobs")}
          {runningJobs > 0 && <span className="ml-1">({runningJobs})</span>}
        </TabsTrigger>
        <TabsTrigger className={width} value="library">
          {t("Library")}
        </TabsTrigger>
      </TabsList>
      <TabsContent className="flex flex-col h-full" value="queue">
        <div className="mt-1">
          <TabQueue />
        </div>
      </TabsContent>
      <TabsContent className="flex flex-col h-full" value="jobs">
        <div className="mt-1">
          <TabJobs />
        </div>
      </TabsContent>
      <TabsContent className="flex flex-col h-full" value="library">
        <div className="mt-1">
          <TabLibrary />
        </div>
      </TabsContent>
    </Tabs>
  );
};

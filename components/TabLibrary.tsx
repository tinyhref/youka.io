import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TabLibrarySongs from "./TabLibrarySongs";
import TabLibraryPlaylists from "./TabLibraryPlaylists";

type TabLibraryType = "songs" | "playlists";

export default function TabLibrary() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabLibraryType>("songs");

  return (
    <Tabs
      className="w-full"
      value={tab}
      onValueChange={(tab: string) => setTab(tab as TabLibraryType)}
    >
      <TabsList className="w-full">
        <TabsTrigger className="w-1/2" value="songs">
          {t("Songs")}
        </TabsTrigger>
        <TabsTrigger className="w-1/2" value="playlists">
          {t("Playlists")}
        </TabsTrigger>
      </TabsList>

      <TabsContent className="flex flex-col h-full" value="songs">
        <div className="mt-1">
          <TabLibrarySongs />
        </div>
      </TabsContent>
      <TabsContent className="flex flex-col h-full" value="playlists">
        <div className="mt-1">
          <TabLibraryPlaylists />
        </div>
      </TabsContent>
    </Tabs>
  );
}

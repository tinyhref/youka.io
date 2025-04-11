import React, { useState } from "react";
import Header from "@/components/Header";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { SettingsItem } from "@/components/settings/SettingsItem";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const item = searchParams.get("item");
  const title = searchParams.get("title");
  const sid = searchParams.get("sid");
  const [selectedKey, setSelectedKey] = useState(item || "general");
  const { t } = useTranslation();

  const breadcrumbs = [
    {
      label: t("Home"),
      url: "/home",
    },
    {
      label: t("Library"),
      url: "/player",
    },
    {
      label: t("Settings"),
      url: "/settings",
    },
  ];

  if (title) {
    breadcrumbs.splice(2, 0, {
      label: title,
      url: `/player?title=${title}&sid=${sid}`,
    });
  }

  return (
    <div className="h-screen flex flex-col">
      <Header showLibrary breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64">
          <SettingsSidebar
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
          />
        </div>
        <div className="flex-1 overflow-auto">
          <div className="mx-10">
            <SettingsItem settingsKey={selectedKey} />
          </div>
        </div>
      </div>
    </div>
  );
}

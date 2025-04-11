import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faArrowRotateLeft,
  faFileImport,
  faFileExport,
  faFileArchive,
  faTextSlash,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "@/components/ui/use-toast";
import rollbar from "@/lib/rollbar";
import { usePlayerStore } from "@/stores/player";
import { SettingsContainer } from "../../SettingsContainer";
import { SelectFileButton } from "@/components/SelectFileButton";
import { importSettings, exportSettings } from "@/lib/library";
import { ipcRenderer } from "electron";
import { useNavigate } from "react-router-dom";
export function DangerSettings() {
  const { t } = useTranslation();
  const reindexLibrary = usePlayerStore((state) => state.reindexLibrary);
  const parseTitles = usePlayerStore((state) => state.parseTitles);
  const analyseLibrary = usePlayerStore((state) => state.analyseLibrary);
  const navigate = useNavigate();
  const [reindexingLibrary, setReindexingLibrary] = useState(false);

  function handleReset() {
    localStorage.removeItem("settings");
    window.location.reload();
  }

  async function handleExportSettings() {
    const filepath = await exportSettings();
    if (filepath) {
      ipcRenderer.send("showItemInFolder", filepath);
    }
  }

  async function handleImportSettings(file: File) {
    await importSettings(file);
    window.location.reload();
  }

  async function handleReindexLibrary() {
    setReindexingLibrary(true);
    try {
      await reindexLibrary();
      toast({
        title: "Library reindexed",
        variant: "success",
      });
    } catch (e) {
      if (e instanceof Error) {
        rollbar.error(e);
        toast({
          title: "Error reindexing library",
          description: e.message,
          variant: "destructive",
        });
      }
    }
    setReindexingLibrary(false);
  }

  async function handleParseTitles() {
    await parseTitles();
    toast({
      title: "Job started successfully",
      variant: "success",
    });
    navigate("/player");
  }

  async function handleAnalyseLibrary() {
    await analyseLibrary();
    toast({
      title: "Job started successfully",
      variant: "success",
    });
    navigate("/player");
  }

  return (
    <SettingsContainer title={t("Danger Zone")}>
      <div className="flex flex-col gap-4 w-fit">
        <Button
          disabled={reindexingLibrary}
          variant="outline"
          onClick={handleReindexLibrary}
        >
          <FontAwesomeIcon icon={faFileArchive} className="mr-2" />
          {t("Reindex Library")}
          {reindexingLibrary && (
            <FontAwesomeIcon icon={faSpinner} className="ml-2" spin />
          )}
        </Button>

        <Button variant="outline" onClick={handleReset}>
          <FontAwesomeIcon icon={faArrowRotateLeft} className="mr-2" />
          {t("Reset Settings")}
        </Button>

        <Button onClick={handleExportSettings} variant="outline">
          <FontAwesomeIcon icon={faFileExport} className="mr-2" />
          {t("Export Settings")}
        </Button>

        <SelectFileButton
          variant="outline"
          onValueChange={handleImportSettings}
          accept=".json"
        >
          <FontAwesomeIcon icon={faFileImport} className="mr-2" />
          {t("Import Settings")}
        </SelectFileButton>

        <Button onClick={handleParseTitles} variant="outline">
          <FontAwesomeIcon icon={faTextSlash} className="mr-2" />
          {t("Parse Titles")}
        </Button>

        <Button onClick={handleAnalyseLibrary} variant="outline">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="mr-2" />
          {t("Analyse Library")}
        </Button>
      </div>
    </SettingsContainer>
  );
}

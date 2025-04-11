import React, { useState } from "react";
import { SettingsItemContainer } from "../../SettingsItemContainer";
import { SettingsContainer } from "../../SettingsContainer";
import { AlignModelSelect } from "@/components/AlignModelSelect";
import { DirectoryInput } from "@/components/DirectoryInput";
import { DefaultLibraryPath } from "@/stores/settings";
import { Switch } from "@/components/ui/switch";
import { useSettingsStore } from "@/stores/settings";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { checkPermissions } from "@/lib/library";
import { toast } from "@/components/ui/use-toast";
import { SplitModelSelect } from "@/components/SplitModelSelect";
import { usePlayerStore } from "@/stores/player";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function GeneralSettings() {
  const { t } = useTranslation();
  const { resolvedTheme, setTheme } = useTheme();
  const reindexLibrary = usePlayerStore((state) => state.reindexLibrary);
  const [reindexing, setReindexing] = useState(false);

  const [
    libraryPath,
    setLibraryPath,
    alignModel,
    setAlignModel,
    splitModel,
    setSplitModel,
  ] = useSettingsStore((state) => [
    state.libraryPath,
    state.setLibraryPath,
    state.alignModel,
    state.setAlignModel,
    state.splitModel,
    state.setSplitModel,
  ]);

  async function handleChangeLibraryPath(newPath: string) {
    try {
      setReindexing(true);
      const hasPermission = await checkPermissions(newPath);
      if (hasPermission) {
        setLibraryPath(newPath);
        await reindexLibrary();
      } else {
        toast({
          title: "Error changing library path",
          description: "No permission to write to the folder",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error changing library path",
        description: "No permission to write to the folder",
        variant: "destructive",
      });
    } finally {
      setReindexing(false);
    }
  }

  return (
    <SettingsContainer title={t("General")}>
      <SettingsItemContainer title={t("Dark Mode")}>
        <Switch
          checked={resolvedTheme === "dark"}
          onCheckedChange={(checked) => {
            setTheme(checked ? "dark" : "light");
          }}
        />
      </SettingsItemContainer>

      <SettingsItemContainer>
        <div className="max-w-[600px]">
          <DirectoryInput
            disabled={reindexing}
            label={t("Library Folder")}
            dirname={libraryPath}
            onChange={handleChangeLibraryPath}
            defaultPath={DefaultLibraryPath}
          />
          {reindexing && (
            <FontAwesomeIcon className="m-2" icon={faSpinner} spin />
          )}
        </div>
      </SettingsItemContainer>

      <SettingsItemContainer title={t("Sync Model")}>
        <AlignModelSelect
          value={alignModel}
          onChange={setAlignModel}
          withLabel={false}
        />
      </SettingsItemContainer>

      <SettingsItemContainer title={t("Separate Model")}>
        <SplitModelSelect
          value={splitModel.toString()}
          onValueChange={(value) => setSplitModel(value)}
        />
      </SettingsItemContainer>
    </SettingsContainer>
  );
}

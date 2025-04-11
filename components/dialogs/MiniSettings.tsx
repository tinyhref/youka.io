import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/stores/player";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { checkPermissions } from "@/lib/library";
import {
  DefaultExportPath,
  DefaultLibraryPath,
  useSettingsStore,
} from "@/stores/settings";
import rollbar from "@/lib/rollbar";
import { SettingsItemContainer } from "../settings/SettingsItemContainer";
import { DirectoryInput } from "../DirectoryInput";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MiniSettings = ({ open, onOpenChange }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reindexLibrary] = usePlayerStore((state) => [state.reindexLibrary]);
  const [
    libraryPath,
    setLibraryPath,
    exportPath,
    setExportPath,
  ] = useSettingsStore((state) => [
    state.libraryPath,
    state.setLibraryPath,
    state.exportPath,
    state.setExportPath,
  ]);

  async function handleChangeLibraryPath(newPath: string) {
    const hasPermission = await checkPermissions(newPath);
    if (hasPermission) {
      setLibraryPath(newPath);
      await handleReindexLibrary();
    } else {
      toast({
        title: "Error changing library path",
        description: "No permission to write to the folder",
        variant: "destructive",
      });
    }
  }

  async function handleChangeExportPath(newPath: string) {
    const hasPermission = await checkPermissions(newPath);
    if (hasPermission) {
      setExportPath(newPath);
    } else {
      toast({
        title: "Error changing export path",
        description: "No permission to write to the folder",
        variant: "destructive",
      });
    }
  }

  async function handleReindexLibrary() {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Settings")}</DialogTitle>
        </DialogHeader>

        <SettingsItemContainer>
          <div className="max-w-[600px]">
            <DirectoryInput
              label={t("Library Folder")}
              dirname={libraryPath}
              onChange={handleChangeLibraryPath}
              defaultPath={DefaultLibraryPath}
            />
          </div>
        </SettingsItemContainer>

        <SettingsItemContainer>
          <div className="max-w-[600px]">
            <DirectoryInput
              label={t("Export Folder")}
              dirname={exportPath}
              onChange={handleChangeExportPath}
              defaultPath={DefaultExportPath}
            />
          </div>
        </SettingsItemContainer>

        <DialogFooter>
          <Button
            disabled={loading}
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("Cancel")}
          </Button>
          {
            <Button disabled={loading} onClick={() => onOpenChange(false)}>
              {t("Save")}
              {loading && (
                <FontAwesomeIcon
                  icon={faSpinner}
                  spin={loading}
                  className="ml-2"
                />
              )}
            </Button>
          }
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

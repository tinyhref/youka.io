import React, { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { dialog } from "@electron/remote";
import { useToast } from "./ui/use-toast";
import * as report from "@/lib/report";
import { ipcRenderer } from "electron";
import { gotoDownload } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings";
import { useTranslation } from "react-i18next";

declare module "react" {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    // extends React's HTMLAttributes
    directory?: string; // remember to make these attributes optional....
    webkitdirectory?: string;
  }
}

interface Props {
  label: string;
  dirname: string;
  onChange: (dirname: string) => void;
  defaultPath?: string;
  disabled?: boolean;
}

export function DirectoryInput({
  label,
  dirname,
  onChange,
  defaultPath,
  disabled,
}: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [value, setValue] = useState<string>(dirname);
  const [supported, setSupported] = useState<boolean>(false);
  const [libraryPath] = useSettingsStore((state) => [state.libraryPath]);

  useEffect(() => {
    setValue(dirname);
  }, [dirname]);

  useEffect(() => {
    async function init() {
      try {
        const version = await ipcRenderer.invoke("version");
        if (version) {
          setSupported(true);
        }
      } catch {}
    }
    init();
  }, []);

  async function handleClick() {
    try {
      const { filePaths } = await dialog.showOpenDialog({
        properties: ["openDirectory"],
        defaultPath: value,
      });
      if (!filePaths?.length) return;
      const newDirname = filePaths[0];
      setValue(newDirname);
      onChange(newDirname);
    } catch (e) {
      if (e instanceof Error) {
        toast({
          variant: "destructive",
          title: "Dir change failed",
          description: e.message,
        });
        report.error(e);
      }
    }
  }

  return (
    <div className="flex flex-col">
      <Label>{label}</Label>
      <div className="flex flex-row mt-2 gap-2">
        <Input
          disabled={disabled}
          readOnly
          value={value}
          onClick={handleClick}
        />
        <Button
          disabled={!supported || disabled}
          variant="outline"
          onClick={handleClick}
        >
          {t("Change")}
        </Button>
        {defaultPath && value !== defaultPath && (
          <Button
            disabled={disabled}
            variant="outline"
            onClick={() => onChange(defaultPath)}
          >
            {t("Reset")}
          </Button>
        )}
      </div>
      <Input
        className="hidden"
        type="file"
        directory=""
        webkitdirectory=""
        disabled={disabled}
      />
      {!supported && (
        <div className="text-xs p-2">
          To enable, back up your{" "}
          <span
            className="cursor-pointer underline"
            onClick={() => ipcRenderer.send("showItemInFolder", libraryPath)}
          >
            library
          </span>{" "}
          first then{" "}
          <span
            onClick={() => gotoDownload()}
            className="cursor-pointer underline"
          >
            install
          </span>{" "}
          the latest version.
        </div>
      )}
    </div>
  );
}

import { FFmpegPresetList, PixFmt, PixFmtList } from "@/types/player";
import { FFmpegPreset } from "@/types/player";
import React from "react";
import { SettingsItemContainer } from "../../SettingsItemContainer";
import { SettingsContainer } from "../../SettingsContainer";
import { useTranslation } from "react-i18next";
import { DefaultExportPath, useSettingsStore } from "@/stores/settings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingInputNumber } from "../SettingInputNumber";
import { checkPermissions } from "@/lib/library";
import { toast } from "@/components/ui/use-toast";
import { DirectoryInput } from "@/components/DirectoryInput";

export function ExportSettings() {
  const { t } = useTranslation();
  const {
    ffmpegOptions,
    setFFmpegOptions,
    exportPath,
    setExportPath,
  } = useSettingsStore();

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

  return (
    <SettingsContainer title={t("Export")}>
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

      <SettingsItemContainer
        title={t("Speed / Compression Preset")}
        tooltip={
          <div className="text-sm text-primary">
            A preset is a collection of options that will provide a certain
            encoding speed to compression ratio.
            <br />
            A slower preset will provide better compression (compression is
            quality per filesize).
            <br />
            This means that, for example, if you target a certain file size or
            constant bit rate, you will achieve better quality with a slower
            preset.
            <br />
            Similarly, for constant quality encoding, you will simply save
            bitrate by choosing a slower preset.
          </div>
        }
      >
        <Select
          value={ffmpegOptions.preset}
          onValueChange={(value) =>
            setFFmpegOptions({
              ...ffmpegOptions,
              preset: value as FFmpegPreset,
            })
          }
        >
          <SelectTrigger className="w-[180px] capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FFmpegPresetList.map((preset) => (
              <SelectItem key={preset} value={preset} className="capitalize">
                {preset}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingsItemContainer>

      <SettingsItemContainer title="Pixel Format">
        <Select
          value={ffmpegOptions.pixFmt ?? "yuv420p"}
          onValueChange={(value) =>
            setFFmpegOptions({
              ...ffmpegOptions,
              pixFmt: value as PixFmt,
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PixFmtList.map((pixFmt) => (
              <SelectItem key={pixFmt} value={pixFmt}>
                {pixFmt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingsItemContainer>

      <SettingInputNumber
        title="Constant Rate Factor"
        value={ffmpegOptions.crf}
        min={0}
        max={51}
        onValueChange={(value) =>
          setFFmpegOptions({
            ...ffmpegOptions,
            crf: value,
          })
        }
      />
    </SettingsContainer>
  );
}

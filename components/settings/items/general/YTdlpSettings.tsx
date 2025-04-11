import React from "react";
import { SettingsItemContainer } from "../../SettingsItemContainer";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/stores/settings";
import { SettingsContainer } from "../../SettingsContainer";

export function YTdlpSettings() {
  const { t } = useTranslation();
  const {
    youtubeEnabled,
    setYoutubeEnabled,
    maxVideoHeight,
    setMaxVideoHeight,
  } = useSettingsStore();

  return (
    <SettingsContainer title="YT-DLP">
      <SettingsItemContainer
        title={t("Enabled")}
        tooltip={
          <div className="text-sm text-primary">
            yt-dlp is an open source project that allows you to search and
            download online videos.
          </div>
        }
      >
        <Switch checked={youtubeEnabled} onCheckedChange={setYoutubeEnabled} />
      </SettingsItemContainer>
      <SettingsItemContainer title={t("Max Video Quality")}>
        <Select
          value={maxVideoHeight.toString()}
          onValueChange={(value) => setMaxVideoHeight(parseInt(value))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2160">4K</SelectItem>
            <SelectItem value="1080">1080p</SelectItem>
            <SelectItem value="720">720p</SelectItem>
            <SelectItem value="480">480p</SelectItem>
          </SelectContent>
        </Select>
      </SettingsItemContainer>
    </SettingsContainer>
  );
}

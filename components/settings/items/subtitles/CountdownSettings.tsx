import React from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { SettingsContainer } from "../../SettingsContainer";
import { SettingsItemContainer } from "../../SettingsItemContainer";
import { AssCountdownPluginOptions } from "@/lib/ass/plugins/countdown";
import { SettingCheckbox } from "../SettingCheckbox";
import { SettingsPreviewAss } from "../../SettingsPreviewAss";
import {
  DefaultAlignment,
  DefaultDuration,
  getSubtitlesPresetWithAssPlugins,
} from "./utils";
import { SettingRow } from "../SettingRow";
import { SettingStyle } from "../SettingStyle";
import { DefaultAssCountdownPluginOptions } from "@/consts";
import { SubtitlesPreset } from "@/types";
import { AssPluginRuntime } from "@/lib/ass/plugins/types";

interface Props {
  settings: AssCountdownPluginOptions;
  setSettings: (settings: AssCountdownPluginOptions) => void;
  runtime: AssPluginRuntime;
  subtitlesPreset: SubtitlesPreset;
}
export function AssCountdownPluginSettings({
  settings,
  setSettings,
  runtime,
  subtitlesPreset,
}: Props) {
  const { t } = useTranslation();

  return (
    <SettingsContainer
      title={t("plugins.countdown.title")}
      description={t("plugins.countdown.description")}
      reset={{
        settings: DefaultAssCountdownPluginOptions,
        setSettings,
      }}
    >
      <SettingsPreviewAss
        alignment={DefaultAlignment}
        subtitlesPreset={getSubtitlesPresetWithAssPlugins(subtitlesPreset, [
          settings,
        ])}
        runtime={runtime}
        duration={DefaultDuration}
      />

      <SettingRow>
        <SettingCheckbox
          title={t("Enabled")}
          value={settings.enabled}
          onChange={(enabled) =>
            setSettings({
              ...settings,
              enabled,
            })
          }
        />

        <SettingCheckbox
          title={t("Auto Color")}
          value={settings.autoColor}
          onChange={(autoColor) => setSettings({ ...settings, autoColor })}
        />
      </SettingRow>

      <SettingStyle
        style={settings.style}
        onChange={(style) => setSettings({ ...settings, style })}
        withPrimaryColor={!settings.autoColor}
        withOutlineColor={!settings.autoColor}
        withFontSize
        withFontName
        withAlignment
        withOutline
      />

      <SettingsItemContainer
        title={`${t("Gap")} (${t("Seconds")})`}
        tooltip={
          <span>
            Insert the text when the gap between the end of the previous
            subtitle and the start of the next subtitle is greater than the gap
          </span>
        }
      >
        <Input
          type="number"
          className="w-20"
          value={settings.gap}
          onChange={(e) =>
            setSettings({
              ...settings,
              gap: Number(e.target.value),
            })
          }
        />
      </SettingsItemContainer>

      <SettingsItemContainer title={t("Countdown")}>
        <Input
          type="number"
          className="w-20"
          value={settings.counter}
          onChange={(e) =>
            setSettings({
              ...settings,
              counter: Number(e.target.value),
            })
          }
        />
      </SettingsItemContainer>
    </SettingsContainer>
  );
}

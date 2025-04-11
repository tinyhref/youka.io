import React from "react";
import { useTranslation } from "react-i18next";
import { Ass123PluginOptions } from "@/lib/ass";
import { Input } from "@/components/ui/input";
import { SettingsContainer } from "../../SettingsContainer";
import { SettingsItemContainer } from "../../SettingsItemContainer";
import { SettingCheckbox } from "../SettingCheckbox";
import { SettingsPreviewAss } from "../../SettingsPreviewAss";
import {
  DefaultDuration,
  generateAlignment,
  getSubtitlesPresetWithAssPlugins,
} from "./utils";
import { SettingRow } from "../SettingRow";
import { SettingStyle } from "../SettingStyle";
import { DefaultAss123PluginOptions } from "@/consts";
import { SubtitlesPreset } from "@/types";
import { AssPluginRuntime } from "@/lib/ass/plugins/types";

interface Props {
  settings: Ass123PluginOptions;
  setSettings: (settings: Ass123PluginOptions) => void;
  runtime: AssPluginRuntime;
  subtitlesPreset: SubtitlesPreset;
}

const alignment = generateAlignment({ start: 3 });

export function Ass123PluginSettings({
  settings,
  setSettings,
  runtime,
  subtitlesPreset,
}: Props) {
  const { t } = useTranslation();

  return (
    <SettingsContainer
      title={t("plugins.gap_text.title")}
      description={t("plugins.gap_text.description")}
      reset={{
        settings: DefaultAss123PluginOptions,
        setSettings,
      }}
    >
      <SettingsPreviewAss
        alignment={alignment}
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

        <SettingCheckbox
          title={t("Auto Alignment")}
          value={settings.autoAlignment}
          onChange={(autoAlignment) =>
            setSettings({ ...settings, autoAlignment })
          }
        />
      </SettingRow>

      <SettingsItemContainer title={t("Text")}>
        <Input
          className="w-40"
          value={settings.text}
          onChange={(e) => setSettings({ ...settings, text: e.target.value })}
        />
      </SettingsItemContainer>

      <SettingStyle
        style={settings.style}
        onChange={(style) => setSettings({ ...settings, style })}
        withPrimaryColor={!settings.autoColor}
        withSecondaryColor={!settings.autoColor}
        withFontName
        withFontSize
        withOutline
        withOutlineColor
        withBold
        withUppercase
        withItalic
        withAlignment={!settings.autoAlignment}
        withMarginBottom
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
      <SettingsItemContainer title={`${t("Duration")} (${t("Seconds")})`}>
        <Input
          type="number"
          className="w-20"
          value={settings.duration}
          onChange={(e) =>
            setSettings({
              ...settings,
              duration: Number(e.target.value),
            })
          }
        />
      </SettingsItemContainer>
    </SettingsContainer>
  );
}

import React from "react";
import { useTranslation } from "react-i18next";
import { SettingsContainer } from "../../SettingsContainer";
import { AssTitlePluginOptions } from "@/lib/ass/plugins/title";
import { SettingCheckbox } from "../SettingCheckbox";
import { SettingsPreviewAss } from "../../SettingsPreviewAss";
import { EmptyAlignment, getSubtitlesPresetWithAssPlugins } from "./utils";
import { SettingStyle } from "../SettingStyle";
import { SettingRow } from "../SettingRow";
import { SettingInputNumber } from "../SettingInputNumber";
import { DefaultAssTitlePluginOptionsHorizontal } from "@/consts";
import { AssPluginRuntime } from "@/lib/ass/plugins/types";
import { SubtitlesPreset } from "@/types";

interface Props {
  settings: AssTitlePluginOptions;
  setSettings: (settings: AssTitlePluginOptions) => void;
  runtime: AssPluginRuntime;
  subtitlesPreset: SubtitlesPreset;
}
export function AssTitlePluginSettings({
  settings,
  setSettings,
  runtime,
  subtitlesPreset,
}: Props) {
  const { t } = useTranslation();

  return (
    <SettingsContainer
      title={t("plugins.title.title")}
      description={t("plugins.title.description")}
      reset={{
        settings: DefaultAssTitlePluginOptionsHorizontal,
        setSettings,
      }}
    >
      <SettingsPreviewAss
        alignment={EmptyAlignment}
        subtitlesPreset={getSubtitlesPresetWithAssPlugins(subtitlesPreset, [
          settings,
        ])}
        runtime={runtime}
        duration={5}
      />

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

      <SettingStyle
        label={t("Title Style")}
        style={settings.style}
        onChange={(style) => setSettings({ ...settings, style })}
        withPrimaryColor
        withFontName
        withFontSize
        withOutline
        withOutlineColor
        withAlignment
        withBold
        withUppercase
        withItalic
        withMarginBottom
        withBlur
        withShadow
      />

      <SettingStyle
        label={t("Artist Style")}
        style={settings.artistStyle || settings.style}
        onChange={(style) => setSettings({ ...settings, artistStyle: style })}
        withPrimaryColor
        withFontName
        withFontSize
        withOutline
        withOutlineColor
        withAlignment
        withBold
        withUppercase
        withItalic
        withMarginBottom
        withBlur
        withShadow
      />

      <SettingRow>
        <SettingInputNumber
          title={`Start ${t("Seconds")}`}
          value={settings.start}
          onValueChange={(start) => setSettings({ ...settings, start })}
        />
        <SettingInputNumber
          title={`Duration ${t("Seconds")}`}
          value={settings.duration}
          onValueChange={(duration) => setSettings({ ...settings, duration })}
        />
      </SettingRow>

      <SettingRow>
        <SettingInputNumber
          title={`${t("Fade In")} (${t("Milliseconds")})`}
          min={0}
          step={100}
          value={settings.fadeInMs || 300}
          onValueChange={(fadeInMs) => setSettings({ ...settings, fadeInMs })}
        />
        <SettingInputNumber
          title={`${t("Fade Out")} (${t("Milliseconds")})`}
          min={0}
          step={100}
          value={settings.fadeOutMs || 300}
          onValueChange={(fadeOutMs) => setSettings({ ...settings, fadeOutMs })}
        />
      </SettingRow>
    </SettingsContainer>
  );
}

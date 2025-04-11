import React from "react";
import { useTranslation } from "react-i18next";
import { SettingsContainer } from "../../SettingsContainer";
import { AssIndicatorPluginOptions } from "@/lib/ass/plugins/indicator";
import { SettingCheckbox } from "../SettingCheckbox";
import { SettingInputNumber } from "../SettingInputNumber";
import { SettingsPreviewAss } from "../../SettingsPreviewAss";
import {
  DefaultAlignment,
  DefaultDuration,
  getSubtitlesPresetWithAssPlugins,
} from "./utils";
import { SettingRow } from "../SettingRow";
import { SettingInputText } from "../SettingInputText";
import { SettingStyle } from "../SettingStyle";
import { DefaultAssIndicatorPluginOptions } from "@/consts";
import { AssPluginRuntime } from "@/lib/ass/plugins/types";
import { SubtitlesPreset } from "@/types";

interface Props {
  settings: AssIndicatorPluginOptions;
  setSettings: (settings: AssIndicatorPluginOptions) => void;
  runtime: AssPluginRuntime;
  subtitlesPreset: SubtitlesPreset;
}

export function AssIndicatorPluginSettings({
  settings,
  setSettings,
  runtime,
  subtitlesPreset,
}: Props) {
  const { t } = useTranslation();

  runtime.styleOptionsMapping[0] = settings.style;

  return (
    <SettingsContainer
      title="Timing Indicator"
      description="A visual cue that shows when to start singing by indicating the timing before the lyrics are highlighted"
      reset={{
        settings: DefaultAssIndicatorPluginOptions,
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
          onChange={(e) => setSettings({ ...settings, enabled: e })}
        />
        <SettingCheckbox
          title={t("Auto Color")}
          value={settings.autoColor}
          onChange={(autoColor) => setSettings({ ...settings, autoColor })}
        />
        <SettingCheckbox
          title={t("Auto Size")}
          value={settings.autoSize}
          onChange={(autoSize) => setSettings({ ...settings, autoSize })}
        />
      </SettingRow>

      <SettingInputText
        title={t("Text")}
        value={settings.text}
        onValueChange={(e) => setSettings({ ...settings, text: e })}
      />

      <SettingStyle
        style={settings.style}
        onChange={(style) => setSettings({ ...settings, style })}
        withPrimaryColor={!settings.autoColor}
        withOutlineColor={!settings.autoColor}
        withFontSize={!settings.autoSize}
        withFontName
        withOutline
      />

      <SettingRow>
        <SettingInputNumber
          title={`${t("Gap")} (${t("Seconds")})`}
          tooltip="Insert the text when the gap between the end of the previous subtitle and the start of the next subtitle is greater than the gap"
          value={settings.gap}
          onValueChange={(e) => setSettings({ ...settings, gap: e })}
        />

        <SettingInputNumber
          title={`${t("Duration")} (${t("Seconds")})`}
          tooltip="The duration of the indicator"
          value={settings.duration}
          onValueChange={(e) => setSettings({ ...settings, duration: e })}
        />
      </SettingRow>

      <SettingRow>
        <SettingInputNumber
          title={`${t("Start")} (px)`}
          value={settings.startPx}
          onValueChange={(e) => setSettings({ ...settings, startPx: e })}
        />
        <SettingInputNumber
          title={`${t("End")} (px)`}
          value={settings.endPx}
          onValueChange={(e) => setSettings({ ...settings, endPx: e })}
        />
      </SettingRow>
    </SettingsContainer>
  );
}

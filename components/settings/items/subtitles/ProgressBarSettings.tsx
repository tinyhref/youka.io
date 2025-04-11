import React from "react";
import { useTranslation } from "react-i18next";
import { AssProgressBarPluginOptions } from "@/lib/ass";
import { SettingsContainer } from "../../SettingsContainer";
import { SettingCheckbox } from "../SettingCheckbox";
import { SettingsPreviewAss } from "../../SettingsPreviewAss";
import { SettingInputNumber } from "../SettingInputNumber";
import { generateAlignment, getSubtitlesPresetWithAssPlugins } from "./utils";
import { SettingRow } from "../SettingRow";
import { SettingStyle } from "../SettingStyle";
import { DefaultAssProgressBarPluginOptions } from "@/consts";
import { SubtitlesPreset } from "@/types";
import { AssPluginRuntime } from "@/lib/ass/plugins/types";

interface Props {
  settings: AssProgressBarPluginOptions;
  setSettings: (settings: AssProgressBarPluginOptions) => void;
  runtime: AssPluginRuntime;
  subtitlesPreset: SubtitlesPreset;
}
const alignment = generateAlignment({ start: 15 });

export function AssProgressBarPluginSettings({
  settings,
  setSettings,
  runtime,
  subtitlesPreset,
}: Props) {
  const { t } = useTranslation();

  return (
    <SettingsContainer
      title={t("plugins.gap_progress_bar.title")}
      description={t("plugins.gap_progress_bar.description")}
      reset={{
        settings: DefaultAssProgressBarPluginOptions,
        setSettings,
      }}
    >
      <SettingsPreviewAss
        alignment={alignment}
        subtitlesPreset={getSubtitlesPresetWithAssPlugins(subtitlesPreset, [
          settings,
        ])}
        runtime={runtime}
        duration={15}
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
        withSecondaryColor={!settings.autoColor}
        withOutlineColor={!settings.autoColor}
        withOutline
        withAlignment
        withMarginBottom
        withAlpha
      />

      <SettingRow>
        <SettingInputNumber
          title={`${t("Min Duration")}  ${t("Seconds")}`}
          value={settings.minDuration}
          onValueChange={(minDuration) =>
            setSettings({ ...settings, minDuration })
          }
        />

        <SettingInputNumber
          title={`${t("Max Duration")}  ${t("Seconds")}`}
          value={settings.maxDuration}
          onValueChange={(maxDuration) =>
            setSettings({ ...settings, maxDuration })
          }
        />
      </SettingRow>

      <SettingRow>
        <SettingInputNumber
          title={t("Width")}
          value={settings.x}
          onValueChange={(x) => setSettings({ ...settings, x })}
        />

        <SettingInputNumber
          title={t("Height")}
          value={settings.y}
          onValueChange={(y) => setSettings({ ...settings, y })}
        />
      </SettingRow>

      <SettingRow>
        <SettingInputNumber
          title={`${t("Fade In")} (${t("Milliseconds")})`}
          value={settings.fadeInMs}
          onValueChange={(fadeInMs) => setSettings({ ...settings, fadeInMs })}
        />
        <SettingInputNumber
          title={`${t("Fade Out")} (${t("Milliseconds")})`}
          value={settings.fadeOutMs}
          onValueChange={(fadeOutMs) => setSettings({ ...settings, fadeOutMs })}
        />
      </SettingRow>

      <SettingRow>
        <SettingInputNumber
          title={`${t("Gap")} (${t("Start")})`}
          tooltip="The gap between the progress bar and the previous subtitle."
          min={0}
          value={settings.gapStart}
          onValueChange={(gapStart) => setSettings({ ...settings, gapStart })}
        />
        <SettingInputNumber
          title={`${t("Gap")} (${t("End")})`}
          tooltip="The gap between the progress bar and the next subtitle."
          min={0}
          value={settings.gapEnd}
          onValueChange={(gapEnd) => setSettings({ ...settings, gapEnd })}
        />
      </SettingRow>

      <SettingRow>
        <SettingInputNumber
          title="Gap from Song Start"
          tooltip="The gap between the progress bar and the song start."
          min={0}
          value={settings.gapSongStart}
          onValueChange={(gapSongStart) =>
            setSettings({ ...settings, gapSongStart })
          }
        />
      </SettingRow>
    </SettingsContainer>
  );
}

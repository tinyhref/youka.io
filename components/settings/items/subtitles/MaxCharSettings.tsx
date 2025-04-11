import React from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { SettingsContainer } from "../../SettingsContainer";
import { SettingsItemContainer } from "../../SettingsItemContainer";
import {
  AlignmentMaxCharPluginOptions,
  DefaultAlignmentMaxCharPluginOptions,
} from "@/lib/alignment";
import { SettingCheckbox } from "../SettingCheckbox";
import { SettingsPreviewAss } from "../../SettingsPreviewAss";
import {
  DefaultAlignment,
  getSubtitlesPresetWithAlignmentPlugins,
} from "./utils";
import { DefaultDuration } from "./utils";
import { AssPluginRuntime } from "@/lib/ass/plugins/types";
import { SubtitlesPreset } from "@/types";

interface Props {
  settings: AlignmentMaxCharPluginOptions;
  setSettings: (settings: AlignmentMaxCharPluginOptions) => void;
  runtime: AssPluginRuntime;
  subtitlesPreset: SubtitlesPreset;
}

export function AlignmentMaxCharPluginSettings({
  settings,
  setSettings,
  runtime,
  subtitlesPreset,
}: Props) {
  const { t } = useTranslation();

  return (
    <SettingsContainer
      title={t("plugins.max_chars.title")}
      description={t("plugins.max_chars.description")}
      reset={{
        settings: DefaultAlignmentMaxCharPluginOptions,
        setSettings,
      }}
    >
      <SettingsPreviewAss
        alignment={DefaultAlignment}
        subtitlesPreset={getSubtitlesPresetWithAlignmentPlugins(
          subtitlesPreset,
          [settings]
        )}
        runtime={runtime}
        duration={DefaultDuration}
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
      <SettingsItemContainer title={t("Limit")}>
        <Input
          type="number"
          className="w-20"
          value={settings.limit}
          onChange={(e) =>
            setSettings({
              ...settings,
              limit: Number(e.target.value),
            })
          }
        />
      </SettingsItemContainer>
    </SettingsContainer>
  );
}

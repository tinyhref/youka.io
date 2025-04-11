import React from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { SettingsContainer } from "../../SettingsContainer";
import { SettingsItemContainer } from "../../SettingsItemContainer";
import { AssFadePluginOptions } from "@/lib/ass/plugins/fade";
import { SettingCheckbox } from "../SettingCheckbox";
import { SettingsPreviewAss } from "../../SettingsPreviewAss";
import { DefaultAlignment } from "./utils";
import { DefaultAssFadePluginOptions } from "@/consts";
import { SubtitlesPreset } from "@/types";
import { AssPluginRuntime } from "@/lib/ass/plugins/types";

interface Props {
  settings: AssFadePluginOptions;
  setSettings: (settings: AssFadePluginOptions) => void;
  runtime: AssPluginRuntime;
  subtitlesPreset: SubtitlesPreset;
}

export function AssFadePluginSettings({
  settings,
  setSettings,
  runtime,
  subtitlesPreset,
}: Props) {
  const { t } = useTranslation();
  return (
    <SettingsContainer
      title={t("plugins.fade.title")}
      description={t("plugins.fade.description")}
      reset={{
        settings: DefaultAssFadePluginOptions,
        setSettings,
      }}
    >
      <SettingsPreviewAss
        alignment={DefaultAlignment}
        subtitlesPreset={subtitlesPreset}
        runtime={runtime}
        duration={10}
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

      <SettingsItemContainer title={`${t("Fade In")} (${t("Milliseconds")})`}>
        <Input
          type="number"
          className="w-20"
          step={100}
          value={settings.fadein}
          onChange={(e) =>
            setSettings({
              ...settings,
              fadein: Number(e.target.value),
            })
          }
        />
      </SettingsItemContainer>

      <SettingsItemContainer title={`${t("Fade Out")} (${t("Milliseconds")})`}>
        <Input
          type="number"
          className="w-20"
          step={100}
          value={settings.fadeout}
          onChange={(e) =>
            setSettings({
              ...settings,
              fadeout: Number(e.target.value),
            })
          }
        />
      </SettingsItemContainer>
    </SettingsContainer>
  );
}

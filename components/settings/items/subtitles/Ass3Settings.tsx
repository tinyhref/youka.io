import React from "react";
import { useTranslation } from "react-i18next";
import { SettingsContainer } from "../../SettingsContainer";
import { SettingInputNumber } from "../SettingInputNumber";
import { Ass3Settings } from "@/lib/ass3";
import { SettingRow } from "../SettingRow";
import { SettingCheckbox } from "../SettingCheckbox";
import { Label } from "@/components/ui/label";
import { DefaultAss3Settings } from "@/consts";
import { SubtitlesPreset } from "@/types/subtitles";
import { AssPluginRuntime } from "@/lib/ass/plugins/types";

interface Props {
  settings: Ass3Settings;
  setSettings: (settings: Ass3Settings) => void;
  runtime: AssPluginRuntime;
  subtitlesPreset: SubtitlesPreset;
}

export function Ass3PluginSettings({ settings, setSettings }: Props) {
  const { t } = useTranslation();

  return (
    <SettingsContainer
      title="Advanced Settings"
      description="Advanced settings for subtitles"
      reset={{
        settings: DefaultAss3Settings,
        setSettings,
      }}
    >
      <div className="space-y-4">
        <div>
          <Label>{t("Active Line")}</Label>
          <SettingRow>
            <SettingInputNumber
              title="End Extra (Seconds)"
              tooltip="Extra time added to the end of the active line."
              min={0}
              step={0.1}
              value={settings.activeLineEndExtraSeconds}
              onValueChange={(value) =>
                setSettings({ ...settings, activeLineEndExtraSeconds: value })
              }
            />
          </SettingRow>
          <SettingRow>
            <SettingInputNumber
              title={`${t("Fade In")} (${t("Milliseconds")})`}
              min={0}
              step={100}
              value={settings.activeLineFadeInMs ?? 0}
              onValueChange={(value) =>
                setSettings({ ...settings, activeLineFadeInMs: value })
              }
            />

            <SettingInputNumber
              title={`${t("Fade Out")} (${t("Milliseconds")})`}
              min={0}
              step={100}
              value={settings.activeLineFadeOutMs ?? 0}
              onValueChange={(value) =>
                setSettings({ ...settings, activeLineFadeOutMs: value })
              }
            />
          </SettingRow>
        </div>

        <div>
          <Label>{t("Inactive Line")}</Label>
          <SettingRow>
            <SettingCheckbox
              title={t("Enabled")}
              tooltip="Show a waiting line when the gap between words exceeds the gap value."
              value={settings.waitingLineEnabled}
              onChange={(checked) =>
                setSettings({ ...settings, waitingLineEnabled: checked })
              }
            />
          </SettingRow>

          {settings.waitingLineEnabled && (
            <>
              <SettingRow>
                <SettingInputNumber
                  title="Gap"
                  tooltip="Show a waiting line when the gap between words exceeds the gap value."
                  min={0}
                  value={settings.waitingLineGap}
                  onValueChange={(value) =>
                    setSettings({ ...settings, waitingLineGap: value })
                  }
                />

                <SettingInputNumber
                  title="Duration"
                  tooltip="The duration of the waiting line."
                  min={0}
                  value={settings.waitingLineDuration}
                  onValueChange={(value) =>
                    setSettings({ ...settings, waitingLineDuration: value })
                  }
                />
              </SettingRow>

              <SettingRow>
                <SettingInputNumber
                  title={`${t("Fade In")} (${t("Milliseconds")})`}
                  min={0}
                  step={100}
                  value={settings.waitingLineFadeInMs ?? 0}
                  onValueChange={(value) =>
                    setSettings({ ...settings, waitingLineFadeInMs: value })
                  }
                />

                <SettingInputNumber
                  title={`${t("Fade Out")} (${t("Milliseconds")})`}
                  min={0}
                  step={100}
                  value={settings.waitingLineFadeOutMs ?? 0}
                  onValueChange={(value) =>
                    setSettings({ ...settings, waitingLineFadeOutMs: value })
                  }
                />
              </SettingRow>
            </>
          )}
        </div>
      </div>
    </SettingsContainer>
  );
}

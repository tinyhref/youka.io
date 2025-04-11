import React from "react";
import { useTranslation } from "react-i18next";
import { SettingsContainer } from "../../SettingsContainer";
import {
  AlignmentAutoBreakPluginOptions,
  DefaultAlignmentAutoBreakPluginOptions,
} from "@/lib/alignment";
import { SettingCheckbox } from "../SettingCheckbox";
import { SettingInputNumber } from "../SettingInputNumber";

interface Props {
  settings: AlignmentAutoBreakPluginOptions;
  setSettings: (settings: AlignmentAutoBreakPluginOptions) => void;
}

export function AlignmentAutoBreakPluginSettings({
  settings,
  setSettings,
}: Props) {
  const { t } = useTranslation();

  return (
    <SettingsContainer
      title={t("Auto Line Break")}
      description="Automatically break lines when the gap between words exceeds the average."
      reset={{
        settings: DefaultAlignmentAutoBreakPluginOptions,
        setSettings,
      }}
    >
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

      <SettingInputNumber
        title="Extra Buffer"
        min={0}
        value={settings.extraBuffer}
        onValueChange={(value) =>
          setSettings({ ...settings, extraBuffer: value })
        }
      />
    </SettingsContainer>
  );
}

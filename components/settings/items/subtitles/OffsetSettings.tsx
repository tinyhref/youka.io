import React from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { SettingsContainer } from "../../SettingsContainer";
import { SettingsItemContainer } from "../../SettingsItemContainer";
import { AssOffsetPluginOptions } from "@/lib/ass/plugins/offset";
import { SettingCheckbox } from "../SettingCheckbox";
import { DefaultAssOffsetPluginOptions } from "@/consts";

interface Props {
  settings: AssOffsetPluginOptions;
  setSettings: (settings: AssOffsetPluginOptions) => void;
}

export function AssOffsetPluginSettings({ settings, setSettings }: Props) {
  const { t } = useTranslation();
  return (
    <SettingsContainer
      title={t("plugins.offset.title")}
      description={t("plugins.offset.description")}
      reset={{
        settings: DefaultAssOffsetPluginOptions,
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

      <SettingsItemContainer title={`${t("Offset")} (${t("Seconds")})`}>
        <Input
          type="number"
          className="w-20"
          step={0.1}
          value={settings.offset}
          onChange={(e) =>
            setSettings({
              ...settings,
              offset: Number(e.target.value),
            })
          }
        />
      </SettingsItemContainer>
    </SettingsContainer>
  );
}

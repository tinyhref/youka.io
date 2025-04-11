import React, { useState } from "react";
import { SettingsContainer } from "../../SettingsContainer";
import { SettingInputNumber } from "../SettingInputNumber";
import { SettingsPreviewAss } from "../../SettingsPreviewAss";
import { SettingCheckbox } from "../SettingCheckbox";
import { generateAlignment } from "./utils";
import { useTranslation } from "react-i18next";
import { Ass4Settings } from "@/lib/ass4";
import { DefaultAss4Settings } from "@/consts";
import { SubtitlesPreset } from "@/types";
import { AssPluginRuntime } from "@/lib/ass/plugins/types";

interface Props {
  settings: Ass4Settings;
  setSettings: (settings: Ass4Settings) => void;
  runtime: AssPluginRuntime;
  subtitlesPreset: SubtitlesPreset;
}

const alignment = generateAlignment({ singer: 0, numberOfLines: 6, start: 3 });

export function Ass4SettingsPlugin({
  settings,
  setSettings,
  runtime,
  subtitlesPreset,
}: Props) {
  const { t } = useTranslation();
  const [locked, setLocked] = useState(true);
  const [spacing, setSpacing] = useState(
    settings.subtitlesPosition.lowerSecondLine.y -
      settings.subtitlesPosition.lowerFirstLine.y
  );

  function handleXChange(x: number) {
    setSettings({
      ...settings,
      subtitlesPosition: {
        upperFirstLine: {
          ...settings.subtitlesPosition.upperFirstLine,
          x,
        },
        upperSecondLine: {
          ...settings.subtitlesPosition.upperSecondLine,
          x,
        },
        lowerFirstLine: {
          ...settings.subtitlesPosition.lowerFirstLine,
          x,
        },
        lowerSecondLine: {
          ...settings.subtitlesPosition.lowerSecondLine,
          x,
        },
      },
    });
  }

  function handleChange(
    value: number,
    line:
      | "upperFirstLine"
      | "upperSecondLine"
      | "lowerFirstLine"
      | "lowerSecondLine"
  ) {
    if (locked) {
      const diff = value - settings.subtitlesPosition[line].y;
      setSettings({
        ...settings,
        subtitlesPosition: {
          upperFirstLine: {
            ...settings.subtitlesPosition.upperFirstLine,
            y: settings.subtitlesPosition.upperFirstLine.y + diff,
          },
          upperSecondLine: {
            ...settings.subtitlesPosition.upperSecondLine,
            y: settings.subtitlesPosition.upperSecondLine.y + diff,
          },
          lowerFirstLine: {
            ...settings.subtitlesPosition.lowerFirstLine,
            y: settings.subtitlesPosition.lowerFirstLine.y + diff,
          },
          lowerSecondLine: {
            ...settings.subtitlesPosition.lowerSecondLine,
            y: settings.subtitlesPosition.lowerSecondLine.y + diff,
          },
        },
      });
    } else {
      setSettings({
        ...settings,
        subtitlesPosition: {
          ...settings.subtitlesPosition,
          [line]: {
            ...settings.subtitlesPosition[line],
            y: value,
          },
        },
      });
    }
  }

  function handleSpacingChange(value: number) {
    setSpacing(value);
    setSettings({
      ...settings,
      subtitlesPosition: {
        ...settings.subtitlesPosition,
        upperSecondLine: {
          ...settings.subtitlesPosition.upperSecondLine,
          y: settings.subtitlesPosition.upperFirstLine.y + value,
        },
        lowerFirstLine: {
          ...settings.subtitlesPosition.lowerFirstLine,
          y: settings.subtitlesPosition.upperFirstLine.y + value * 2,
        },
        lowerSecondLine: {
          ...settings.subtitlesPosition.lowerSecondLine,
          y: settings.subtitlesPosition.upperFirstLine.y + value * 3,
        },
      },
    });
  }

  return (
    <SettingsContainer
      title="Advanced Settings"
      description="Advanced settings for subtitles"
      reset={{
        settings: DefaultAss4Settings,
        setSettings,
      }}
    >
      {alignment && (
        <SettingsPreviewAss
          alignment={alignment}
          duration={30}
          color="white"
          options={settings}
          runtime={runtime}
          subtitlesPreset={subtitlesPreset}
        />
      )}

      <SettingCheckbox
        title={t("Lock")}
        value={locked}
        onChange={(e) => setLocked(e)}
      />

      <SettingInputNumber
        title="x"
        value={settings.subtitlesPosition.upperFirstLine.x}
        onValueChange={(e) => handleXChange(e)}
      />

      <div className="flex flex-row gap-2">
        <SettingInputNumber
          title={t("Upper first line")}
          value={settings.subtitlesPosition.upperFirstLine.y}
          onValueChange={(e) => handleChange(e, "upperFirstLine")}
        />
        <SettingInputNumber
          title={t("Upper second line")}
          value={settings.subtitlesPosition.upperSecondLine.y}
          onValueChange={(e) => handleChange(e, "upperSecondLine")}
        />

        <SettingInputNumber
          title={t("Lower first line")}
          value={settings.subtitlesPosition.lowerFirstLine.y}
          onValueChange={(e) => handleChange(e, "lowerFirstLine")}
        />
        <SettingInputNumber
          title={t("Lower second line")}
          value={settings.subtitlesPosition.lowerSecondLine.y}
          onValueChange={(e) => handleChange(e, "lowerSecondLine")}
        />
      </div>
      <div className="flex flex-row gap-2">
        <SettingInputNumber
          title={t("Spacing")}
          value={spacing}
          onValueChange={(e) => handleSpacingChange(e)}
        />
      </div>
    </SettingsContainer>
  );
}

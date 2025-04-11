import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SettingsContainer } from "../../SettingsContainer";
import { SettingRow } from "../SettingRow";
import { SettingCheckbox } from "../SettingCheckbox";
import { Ass2Settings } from "@/lib/ass2";
import { ALL_SINGERS_ID, DefaultAss2Settings } from "@/consts";
import { SettingInputNumber } from "../SettingInputNumber";
import { AlignmentSelectInput } from "@/components/StyleEditor/AlignmentSelectInput";
import { DefaultDuration } from "./utils";
import { SettingsPreviewAss } from "../../SettingsPreviewAss";
import { Alignment3, SubtitlesPreset } from "@/types";
import { AssPluginRuntime } from "@/lib/ass/plugins/types";
import { generateAlignment } from "./utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface Props {
  settings: Ass2Settings;
  setSettings: (settings: Ass2Settings) => void;
  runtime: AssPluginRuntime;
  subtitlesPreset: SubtitlesPreset;
}

export function Ass2LayoutSettings({
  settings,
  setSettings,
  runtime,
  subtitlesPreset,
}: Props) {
  const { t } = useTranslation();
  const [singer, setSinger] = useState<"first" | "second" | "all">("first");
  const [alignment, setAlignment] = useState<Alignment3>();

  useEffect(() => {
    switch (singer) {
      case "first":
        setAlignment(generateAlignment({ singer: 0 }));
        break;
      case "second":
        setAlignment(generateAlignment({ singer: 1 }));
        break;
      case "all":
        setAlignment(generateAlignment({ singer: ALL_SINGERS_ID }));
        break;
    }
  }, [singer]);

  return (
    <SettingsContainer
      title="Layout"
      description="Layout settings for subtitles"
      reset={{
        settings: DefaultAss2Settings,
        setSettings,
      }}
    >
      {alignment && (
        <SettingsPreviewAss
          alignment={alignment}
          subtitlesPreset={subtitlesPreset}
          runtime={runtime}
          duration={DefaultDuration}
        />
      )}

      <RadioGroup
        className="flex flex-row gap-4 mb-6"
        value={singer}
        onValueChange={(e) => setSinger(e as "first" | "second")}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="first" id="r1" />
          <Label htmlFor="r1">{t("Singer 1")}</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="second" id="r2" />
          <Label htmlFor="r2">{t("Singer 2")}</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="all" id="r3" />
          <Label htmlFor="r3">{t("All")}</Label>
        </div>
      </RadioGroup>

      <div>
        <SettingRow>
          {singer === "first" && (
            <AlignmentSelectInput
              label={t("Line Alignment")}
              value={settings.subtitlesPosition.firstSinger.alignment}
              onChange={(alignment) =>
                setSettings({
                  ...settings,
                  subtitlesPosition: {
                    ...settings.subtitlesPosition,
                    firstSinger: {
                      ...settings.subtitlesPosition.firstSinger,
                      alignment,
                    },
                  },
                })
              }
            />
          )}

          {singer === "second" && (
            <AlignmentSelectInput
              label={t("Line Alignment")}
              value={settings.subtitlesPosition.secondSinger.alignment}
              onChange={(alignment) =>
                setSettings({
                  ...settings,
                  subtitlesPosition: {
                    ...settings.subtitlesPosition,
                    secondSinger: {
                      ...settings.subtitlesPosition.secondSinger,
                      alignment,
                    },
                  },
                })
              }
            />
          )}

          {singer === "all" && (
            <AlignmentSelectInput
              label={t("Line Alignment")}
              value={settings.subtitlesPosition.bothSinger.alignment}
              onChange={(alignment) =>
                setSettings({
                  ...settings,
                  subtitlesPosition: {
                    ...settings.subtitlesPosition,
                    bothSinger: {
                      ...settings.subtitlesPosition.bothSinger,
                      alignment,
                    },
                  },
                })
              }
            />
          )}
        </SettingRow>

        {singer === "all" && (
          <SettingRow>
            <SettingCheckbox
              title={t("Duet Line Split")}
              value={settings.subtitlesPosition.duetSplit}
              onChange={(checked) =>
                setSettings({
                  ...settings,
                  subtitlesPosition: {
                    ...settings.subtitlesPosition,
                    duetSplit: checked,
                  },
                })
              }
            />
          </SettingRow>
        )}

        <SettingRow>
          <SettingInputNumber
            title={t("Margin Bottom")}
            value={settings.subtitlesPosition.bothSinger.marginV}
            onValueChange={(value) =>
              setSettings({
                ...settings,
                subtitlesPosition: {
                  ...settings.subtitlesPosition,
                  firstSinger: {
                    ...settings.subtitlesPosition.firstSinger,
                    marginV: value,
                  },
                  secondSinger: {
                    ...settings.subtitlesPosition.secondSinger,
                    marginV: value,
                  },
                  bothSinger: {
                    ...settings.subtitlesPosition.bothSinger,
                    marginV: value,
                  },
                },
              })
            }
          />
        </SettingRow>
      </div>
    </SettingsContainer>
  );
}

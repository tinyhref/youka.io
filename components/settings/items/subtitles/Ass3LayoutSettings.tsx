import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Alignment3, SubtitlesPosition } from "@/types";
import { SettingInputNumber } from "../SettingInputNumber";
import { SettingsPreviewAss } from "../../SettingsPreviewAss";
import { generateAlignment } from "./utils";
import { useTranslation } from "react-i18next";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { SettingCheckbox } from "../SettingCheckbox";
import { ALL_SINGERS_ID, DefaultAss3Settings } from "@/consts";
import { SubtitlesPreset } from "@/types";
import { AssPluginRuntime } from "@/lib/ass/plugins/types";
import { SettingsContainer } from "../../SettingsContainer";

interface Props {
  settings: SubtitlesPosition;
  setSettings: (settings: SubtitlesPosition) => void;
  runtime: AssPluginRuntime;
  subtitlesPreset: SubtitlesPreset;
}

export function Ass3LayoutSettings({
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

  function handleTop() {
    switch (singer) {
      case "first":
        setSettings({
          ...settings,
          firstSinger: {
            ...settings.firstSinger,
            top: { x: 960, y: 120 },
            bottom: { x: 960, y: 240 },
          },
        });
        break;
      case "second":
        setSettings({
          ...settings,
          secondSinger: {
            ...settings.secondSinger,
            top: { x: 960, y: 120 },
            bottom: { x: 960, y: 240 },
          },
        });
        break;
      case "all":
        setSettings({
          ...settings,
          bothSinger: {
            ...settings.bothSinger,
            top: { x: 960, y: 120 },
            bottom: { x: 960, y: 240 },
          },
        });
        break;
    }
  }

  function handleCenter() {
    switch (singer) {
      case "first":
        setSettings({
          ...settings,
          firstSinger: {
            ...settings.firstSinger,
            top: { x: 960, y: 435 },
            bottom: { x: 960, y: 555 },
          },
        });
        break;
      case "second":
        setSettings({
          ...settings,
          secondSinger: {
            ...settings.secondSinger,
            top: { x: 960, y: 435 },
            bottom: { x: 960, y: 555 },
          },
        });
        break;
      case "all":
        setSettings({
          ...settings,
          bothSinger: {
            ...settings.bothSinger,
            top: { x: 960, y: 435 },
            bottom: { x: 960, y: 555 },
          },
        });
    }
  }

  function handleBottom() {
    switch (singer) {
      case "first":
        setSettings({
          ...settings,
          firstSinger: {
            ...settings.firstSinger,
            top: { x: 960, y: 750 },
            bottom: { x: 960, y: 870 },
          },
        });
        break;
      case "second":
        setSettings({
          ...settings,
          secondSinger: {
            ...settings.secondSinger,
            top: { x: 960, y: 750 },
            bottom: { x: 960, y: 870 },
          },
        });
        break;
      case "all":
        setSettings({
          ...settings,
          bothSinger: {
            ...settings.bothSinger,
            top: { x: 960, y: 750 },
            bottom: { x: 960, y: 870 },
          },
        });
    }
  }

  return (
    <SettingsContainer
      title="Layout"
      description="Layout settings for subtitles"
      reset={{
        settings: DefaultAss3Settings.subtitlesPosition,
        setSettings,
      }}
    >
      {alignment && (
        <SettingsPreviewAss
          alignment={alignment}
          duration={10}
          color="white"
          subtitlesPreset={{
            ...subtitlesPreset,
            assPlugins: subtitlesPreset.assPlugins.filter(
              (p) => p.id !== "title"
            ),
          }}
          runtime={runtime}
        />
      )}

      <RadioGroup
        className="flex flex-row gap-4 mb-6"
        value={singer}
        onValueChange={(e) => setSinger(e as "first" | "second" | "all")}
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

      {singer === "all" && (
        <SettingCheckbox
          title={t("Duet Line Split")}
          tooltip="Separates lyrics into different lines for each singer in a duet, making it easier to follow their parts during simultaneous singing."
          value={settings.duetSplit}
          onChange={(e) => setSettings({ ...settings, duetSplit: e })}
        />
      )}

      <div className="flex flex-row gap-2">
        <Button variant="outline" onClick={handleTop}>
          {t("Top")}
        </Button>
        <Button variant="outline" onClick={handleCenter}>
          {t("Center")}
        </Button>
        <Button variant="outline" onClick={handleBottom}>
          {t("Bottom")}
        </Button>
      </div>

      {singer === "first" && (
        <>
          <div className="flex flex-row gap-2">
            <SettingInputNumber
              title={`${t("Top Row")} X`}
              value={settings.firstSinger.top.x}
              onValueChange={(e) =>
                setSettings({
                  ...settings,
                  firstSinger: {
                    ...settings.firstSinger,
                    top: {
                      ...settings.firstSinger.top,
                      x: e,
                    },
                  },
                })
              }
            />
            <SettingInputNumber
              title={`${t("Top Row")} Y`}
              value={settings.firstSinger.top.y}
              onValueChange={(e) =>
                setSettings({
                  ...settings,
                  firstSinger: {
                    ...settings.firstSinger,
                    top: {
                      ...settings.firstSinger.top,
                      y: e,
                    },
                  },
                })
              }
            />
          </div>
          <div className="flex flex-row gap-2">
            <SettingInputNumber
              title={`${t("Bottom Row")} X`}
              value={settings.firstSinger.bottom.x}
              onValueChange={(e) =>
                setSettings({
                  ...settings,
                  firstSinger: {
                    ...settings.firstSinger,
                    bottom: {
                      ...settings.firstSinger.bottom,
                      x: e,
                    },
                  },
                })
              }
            />
            <SettingInputNumber
              title={`${t("Bottom Row")} Y`}
              value={settings.firstSinger.bottom.y}
              onValueChange={(e) =>
                setSettings({
                  ...settings,
                  firstSinger: {
                    ...settings.firstSinger,
                    bottom: {
                      ...settings.firstSinger.bottom,
                      y: e,
                    },
                  },
                })
              }
            />
          </div>
        </>
      )}

      {singer === "second" && (
        <>
          <div className="flex flex-row gap-2">
            <SettingInputNumber
              title={`${t("Top Row")} X`}
              value={settings.secondSinger.top.x}
              onValueChange={(e) =>
                setSettings({
                  ...settings,
                  secondSinger: {
                    ...settings.secondSinger,
                    top: {
                      ...settings.secondSinger.top,
                      x: e,
                    },
                  },
                })
              }
            />
            <SettingInputNumber
              title={`${t("Top Row")} Y`}
              value={settings.secondSinger.top.y}
              onValueChange={(e) =>
                setSettings({
                  ...settings,
                  secondSinger: {
                    ...settings.secondSinger,
                    top: {
                      ...settings.secondSinger.top,
                      y: e,
                    },
                  },
                })
              }
            />
          </div>

          <div className="flex flex-row gap-2">
            <SettingInputNumber
              title={`${t("Bottom Row")} X`}
              value={settings.secondSinger.bottom.x}
              onValueChange={(e) =>
                setSettings({
                  ...settings,
                  secondSinger: {
                    ...settings.secondSinger,
                    bottom: {
                      ...settings.secondSinger.bottom,
                      x: e,
                    },
                  },
                })
              }
            />
            <SettingInputNumber
              title={`${t("Bottom Row")} Y`}
              value={settings.secondSinger.bottom.y}
              onValueChange={(e) =>
                setSettings({
                  ...settings,
                  secondSinger: {
                    ...settings.secondSinger,
                    bottom: {
                      ...settings.secondSinger.bottom,
                      y: e,
                    },
                  },
                })
              }
            />
          </div>
        </>
      )}

      {singer === "all" && (
        <>
          <div className="flex flex-row gap-2">
            <SettingInputNumber
              title={`${t("Top Row")} X`}
              value={settings.bothSinger.top.x}
              onValueChange={(e) =>
                setSettings({
                  ...settings,
                  bothSinger: {
                    ...settings.bothSinger,
                    top: {
                      ...settings.bothSinger.top,
                      x: e,
                    },
                  },
                })
              }
            />
            <SettingInputNumber
              title={`${t("Top Row")} Y`}
              value={settings.bothSinger.top.y}
              onValueChange={(e) =>
                setSettings({
                  ...settings,
                  bothSinger: {
                    ...settings.bothSinger,
                    top: {
                      ...settings.bothSinger.top,
                      y: e,
                    },
                  },
                })
              }
            />
          </div>

          <div className="flex flex-row gap-2">
            <SettingInputNumber
              title={`${t("Bottom Row")} X`}
              value={settings.bothSinger.bottom.x}
              onValueChange={(e) =>
                setSettings({
                  ...settings,
                  bothSinger: {
                    ...settings.bothSinger,
                    bottom: {
                      ...settings.bothSinger.bottom,
                      x: e,
                    },
                  },
                })
              }
            />
            <SettingInputNumber
              title={`${t("Bottom Row")} Y`}
              value={settings.bothSinger.bottom.y}
              onValueChange={(e) =>
                setSettings({
                  ...settings,
                  bothSinger: {
                    ...settings.bothSinger,
                    bottom: {
                      ...settings.bothSinger.bottom,
                      y: e,
                    },
                  },
                })
              }
            />
          </div>
        </>
      )}
    </SettingsContainer>
  );
}

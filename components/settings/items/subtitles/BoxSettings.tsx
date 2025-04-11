import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SettingsContainer } from "../../SettingsContainer";
import { SettingInputNumber } from "../SettingInputNumber";
import { AssBoxPluginOptions } from "@/lib/ass/plugins/box";
import { SettingCheckbox } from "../SettingCheckbox";
import {
  DefaultDuration,
  generateAlignment,
  getSubtitlesPresetWithAssPlugins,
} from "./utils";
import { SettingsPreviewAss } from "../../SettingsPreviewAss";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LineAlignment } from "@/types/style";
import { Alignment3 } from "@/types";
import { Button } from "@/components/ui/button";
import { SettingStyle } from "../SettingStyle";
import { SettingRow } from "../SettingRow";
import { ALL_SINGERS_ID, DefaultAssBoxPluginOptions } from "@/consts";
import { SubtitlesPreset } from "@/types";
import { AssPluginRuntime } from "@/lib/ass/plugins/types";

interface Props {
  settings: AssBoxPluginOptions;
  setSettings: (settings: AssBoxPluginOptions) => void;
  runtime: AssPluginRuntime;
  subtitlesPreset: SubtitlesPreset;
}

export function AssBoxPluginSettings({
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
          style: {
            ...settings.style,
            alignment: LineAlignment.TopCenter,
          },
          firstSingerPosition: { x: 960, y: 60 },
        });
        break;
      case "second":
        setSettings({
          ...settings,
          style: {
            ...settings.style,
            alignment: LineAlignment.TopCenter,
          },
          secondSingerPosition: { x: 960, y: 60 },
        });
        break;
      case "all":
        setSettings({
          ...settings,
          style: {
            ...settings.style,
            alignment: LineAlignment.TopCenter,
          },
          bothSingerPosition: { x: 960, y: 60 },
        });
        break;
    }
  }

  function handleCenter() {
    switch (singer) {
      case "first":
        setSettings({
          ...settings,
          style: {
            ...settings.style,
            alignment: LineAlignment.TopCenter,
          },
          firstSingerPosition: { x: 960, y: 375 },
        });
        break;
      case "second":
        setSettings({
          ...settings,
          style: {
            ...settings.style,
            alignment: LineAlignment.TopCenter,
          },
          secondSingerPosition: { x: 960, y: 375 },
        });
        break;
      case "all":
        setSettings({
          ...settings,
          style: {
            ...settings.style,
            alignment: LineAlignment.TopCenter,
          },
          bothSingerPosition: { x: 960, y: 375 },
        });
        break;
    }
  }

  function handleBottom() {
    switch (singer) {
      case "first":
        setSettings({
          ...settings,
          style: {
            ...settings.style,
            alignment: LineAlignment.TopCenter,
          },
          firstSingerPosition: { x: 960, y: 690 },
        });
        break;
      case "second":
        setSettings({
          ...settings,
          style: {
            ...settings.style,
            alignment: LineAlignment.TopCenter,
          },
          secondSingerPosition: { x: 960, y: 690 },
        });
        break;
      case "all":
        setSettings({
          ...settings,
          style: {
            ...settings.style,
            alignment: LineAlignment.TopCenter,
          },
          bothSingerPosition: { x: 960, y: 690 },
        });
        break;
    }
  }

  return (
    <SettingsContainer
      title={t("Background Box")}
      description="Add a box around the subtitles"
      reset={{
        settings: DefaultAssBoxPluginOptions,
        setSettings,
      }}
    >
      {alignment && (
        <SettingsPreviewAss
          color="white"
          alignment={alignment}
          subtitlesPreset={getSubtitlesPresetWithAssPlugins(subtitlesPreset, [
            settings,
          ])}
          runtime={runtime}
          duration={DefaultDuration}
        />
      )}
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

      <RadioGroup
        className="flex flex-row gap-4 mb-4"
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

      <SettingRow>
        <Button variant="outline" onClick={handleTop}>
          {t("Top")}
        </Button>
        <Button variant="outline" onClick={handleCenter}>
          {t("Center")}
        </Button>
        <Button variant="outline" onClick={handleBottom}>
          {t("Bottom")}
        </Button>
      </SettingRow>

      <SettingStyle
        style={settings.style}
        onChange={(style) => setSettings({ ...settings, style })}
        withPrimaryColor
        withOutlineColor
        withOutline
      />

      <SettingRow>
        <SettingInputNumber
          title={t("Alpha")}
          value={settings.alpha}
          onValueChange={(e) => setSettings({ ...settings, alpha: e })}
          min={0}
          max={255}
        />
      </SettingRow>

      <div className="flex flex-row gap-2">
        <SettingInputNumber
          title={t("Width")}
          value={settings.width}
          onValueChange={(e) => setSettings({ ...settings, width: e })}
        />

        <SettingInputNumber
          title={t("Height")}
          value={settings.height}
          onValueChange={(e) => setSettings({ ...settings, height: e })}
        />
      </div>

      {singer === "first" && (
        <SettingRow>
          <SettingInputNumber
            title="X"
            value={settings.firstSingerPosition.x}
            onValueChange={(e) =>
              setSettings({
                ...settings,
                firstSingerPosition: { ...settings.firstSingerPosition, x: e },
              })
            }
          />
          <SettingInputNumber
            title="Y"
            value={settings.firstSingerPosition.y}
            onValueChange={(e) =>
              setSettings({
                ...settings,
                firstSingerPosition: { ...settings.firstSingerPosition, y: e },
              })
            }
          />
        </SettingRow>
      )}

      {singer === "second" && (
        <SettingRow>
          <SettingInputNumber
            title="X"
            value={settings.secondSingerPosition.x}
            onValueChange={(e) =>
              setSettings({
                ...settings,
                secondSingerPosition: {
                  ...settings.secondSingerPosition,
                  x: e,
                },
              })
            }
          />

          <SettingInputNumber
            title="Y"
            value={settings.secondSingerPosition.y}
            onValueChange={(e) =>
              setSettings({
                ...settings,
                secondSingerPosition: {
                  ...settings.secondSingerPosition,
                  y: e,
                },
              })
            }
          />
        </SettingRow>
      )}

      {singer === "all" && (
        <SettingRow>
          <SettingInputNumber
            title="X"
            value={settings.bothSingerPosition.x}
            onValueChange={(e) =>
              setSettings({
                ...settings,
                bothSingerPosition: {
                  ...settings.bothSingerPosition,
                  x: e,
                },
              })
            }
          />

          <SettingInputNumber
            title="Y"
            value={settings.bothSingerPosition.y}
            onValueChange={(e) =>
              setSettings({
                ...settings,
                bothSingerPosition: {
                  ...settings.bothSingerPosition,
                  y: e,
                },
              })
            }
          />
        </SettingRow>
      )}

      <SettingRow>
        <SettingInputNumber
          title={`${t("Fade In")} (${t("Milliseconds")})`}
          min={0}
          step={100}
          value={settings.fadeInMs || 0}
          onValueChange={(e) => setSettings({ ...settings, fadeInMs: e })}
        />

        <SettingInputNumber
          title={`${t("Fade Out")} (${t("Milliseconds")})`}
          min={0}
          step={100}
          value={settings.fadeOutMs || 0}
          onValueChange={(e) => setSettings({ ...settings, fadeOutMs: e })}
        />
      </SettingRow>
    </SettingsContainer>
  );
}

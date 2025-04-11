import React from "react";
import { SettingsContainer } from "../../SettingsContainer";
import { useSettingsStore } from "@/stores/settings";
import { useTranslation } from "react-i18next";
import { SettingInputNumber } from "../SettingInputNumber";

export default function PlayerSettings() {
  const { t } = useTranslation();

  const [
    pitchStep,
    tempoStep,
    setPitchStep,
    setTempoStep,
  ] = useSettingsStore((state) => [
    state.pitchStep,
    state.tempoStep,
    state.setPitchStep,
    state.setTempoStep,
  ]);

  return (
    <SettingsContainer title={t("Player")}>
      <SettingInputNumber
        title={t("Key Step")}
        value={pitchStep}
        step={0.1}
        min={0.1}
        max={1}
        onValueChange={(value) => setPitchStep(value)}
      />
      <SettingInputNumber
        title={t("Tempo Step")}
        value={tempoStep}
        step={0.01}
        min={0.01}
        max={0.1}
        onValueChange={(value) => setTempoStep(value)}
      />
    </SettingsContainer>
  );
}

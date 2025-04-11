import * as React from "react";
import { useTranslation } from "react-i18next";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import { ExportSettings } from "./general/ExportSettings";
import { DangerSettings } from "./general/DangerSettings";
import { SettingsItemsContainer } from "../SettingsItemsContainer";
import GeneralSettings from "./general/GeneralSettings";
import { YTdlpSettings } from "./general/YTdlpSettings";
import PlayerSettings from "./general/PlayerSettings";

export const icon = faGear;
export const key = "general";

export const Title = () => {
  const { t } = useTranslation();
  return t("General");
};

export function Comp() {
  const [item, setItem] = React.useState("");

  return (
    <div className="flex flex-col">
      <SettingsItemsContainer value={item} onValueChange={setItem}>
        <GeneralSettings />
        <PlayerSettings />
        <ExportSettings />
        <YTdlpSettings />
        <DangerSettings />
      </SettingsItemsContainer>
    </div>
  );
}

import React from "react";
import { CTA } from "../CTA";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlayCircle } from "@fortawesome/free-solid-svg-icons";
import { shell } from "electron";
import { useTranslation } from "react-i18next";

interface QuickStartCTAProps {
  onHide: () => void;
}

export const QuickStartCTA = ({ onHide }: QuickStartCTAProps) => {
  const { t } = useTranslation();
  const url = "https://www.youtube.com/watch?v=B4Z4VvUsD-Q";
  return (
    <CTA
      onClick={() => {
        shell.openExternal(url);
        onHide();
      }}
      icon={<FontAwesomeIcon icon={faPlayCircle} className="text-red-500" />}
      title={t("Watch Quick Start Video")}
      description=""
    />
  );
};

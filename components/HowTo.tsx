import React from "react";
import { OpenExternalButton } from "./OpenExternalButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlayCircle } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

interface Props {
  url: string;
}

export function HowTo({ url }: Props) {
  const { t } = useTranslation();
  return (
    <OpenExternalButton url={url} variant="link">
      <FontAwesomeIcon icon={faPlayCircle} className="mr-2" />
      {t("How to use")}
    </OpenExternalButton>
  );
}

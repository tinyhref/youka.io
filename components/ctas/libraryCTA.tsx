import React from "react";
import { CTA } from "../CTA";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookBookmark } from "@fortawesome/free-solid-svg-icons";

export const LibraryCTA = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <CTA
      onClick={() => navigate("/player")}
      icon={<FontAwesomeIcon icon={faBookBookmark} className="text-pink-500" />}
      title={t("Library")}
      description={t("library.description")}
    />
  );
};

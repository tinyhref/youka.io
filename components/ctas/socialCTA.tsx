import React from "react";
import { faFacebook } from "@fortawesome/free-brands-svg-icons";
import { CTA } from "../CTA";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShare } from "@fortawesome/free-solid-svg-icons";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { shell } from "electron";
import { useTranslation } from "react-i18next";

export const SocialCTA = () => {
  const { t } = useTranslation();
  return (
    <CTA
      onClick={() =>
        shell.openExternal(
          "https://www.facebook.com/profile.php?id=61571544788943"
        )
      }
      icon={<FontAwesomeIcon icon={faShare} className="text-blue-500" />}
      title={t("cta.social.title")}
      description={
        <div className="flex flex-col gap-2">
          <div>{t("cta.social.description.2")}</div>
          <div className="flex flex-row gap-2">
            <div className="flex flex-row items-center cursor-pointer hover:text-blue-500">
              <FontAwesomeIcon
                className="p-2"
                icon={faFacebook as IconProp}
                size="lg"
              />
              <span>Facebook</span>
            </div>
          </div>
        </div>
      }
    />
  );
};

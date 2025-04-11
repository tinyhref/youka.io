import React from "react";
import { CTA } from "../CTA";
import { gotoPricing } from "@/lib/utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping } from "@fortawesome/free-solid-svg-icons";
import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import { useMetadata } from "@/hooks/metadata";

export const UpgradeCTA = () => {
  const { t } = useTranslation();
  const userMetadata = useMetadata();

  return (
    <CTA
      onClick={() =>
        gotoPricing({
          lang: i18n.language,
          medium: "homepage_alert_trial_expired",
          provider: userMetadata?.provider,
        })
      }
      icon={
        <FontAwesomeIcon icon={faCartShopping} className="text-green-500" />
      }
      title={t("Upgrade Now to Create More")}
      description={t("upgrade_description")}
    />
  );
};

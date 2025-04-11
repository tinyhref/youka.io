import React from "react";
import { useTranslation } from "react-i18next";
import { CoinsIcon } from "lucide-react";

export function CreditPreview() {
  const { t } = useTranslation();
  return (
    <div className="flex row items-center gap-2 border rounded-md p-2">
      <CoinsIcon className="w-4 h-4" />
      <span className="text-xs">{t("Creating will use 1 credit")}</span>
    </div>
  );
}

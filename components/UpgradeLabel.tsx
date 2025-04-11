import React from "react";
import { Label } from "./ui/label";
import { useTranslation } from "react-i18next";
import { usePlayerStore } from "@/stores/player";
import { Role } from "@/types";

interface Props {
  role: Role;
  feature: string;
}

export function UpgradeLabel({ role, feature }: Props) {
  const { t } = useTranslation();
  const [setUpgradeOpen] = usePlayerStore((state) => [state.setUpgradeOpen]);

  return (
    <Label
      className="cursor-pointer p-1 rounded bg-yellow-500 text-white text-xs"
      onClick={() => setUpgradeOpen(feature, role)}
    >
      {t("Upgrade")}
    </Label>
  );
}

import React from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/stores/player";
import { gotoPricing } from "@/lib/utils";

export const Global = () => {
  const { t, i18n } = useTranslation();

  const [modal, setCloseModal] = usePlayerStore((state) => [
    state.modal,
    state.setCloseModal,
  ]);

  function handleUpgrade() {
    gotoPricing({
      medium: "global_dialog",
      lang: i18n.language,
    });
  }

  let title,
    description,
    upgrade = false;

  switch (modal.reason) {
    case "NO_USER":
      title = t("dialogs.global.no_user.title");
      description = t("dialogs.global.no_user.description");
      upgrade = true;
      break;
    case "NO_ROLE":
      title = t("dialogs.global.no_role.title");
      description = t("dialogs.global.no_role.description");
      upgrade = true;
      break;
    case "BLOCKED_IP":
      title = t("dialogs.global.blocked_ip.title");
      description = t("dialogs.global.blocked_ip.description");
      break;
    case "RATE_LIMIT":
      title = t("dialogs.global.rate_limit.title");
      description = t("dialogs.global.rate_limit.description");
      upgrade = true;
      break;
    case "DISK_FULL":
      title = t("dialogs.global.disk_full.title");
      description = t("dialogs.global.disk_full.description");
      break;
    case "TOO_BIG":
      title = t("dialogs.global.too_big.title");
      description = t("dialogs.global.too_big.description");
      break;
    case "NO_CREDITS":
      title = t("dialogs.global.no_credits.title");
      description = t("dialogs.global.no_credits.description");
      break;
  }

  return (
    <Dialog open={modal.open} onOpenChange={setCloseModal}>
      <DialogContent>
        <DialogHeader className="text-xl">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-lg">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCloseModal()}>
            {t("Close")}
          </Button>
          {upgrade && <Button onClick={handleUpgrade}>{t("Upgrade")}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

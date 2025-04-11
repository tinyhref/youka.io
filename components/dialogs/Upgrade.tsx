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
import useSubscription from "@/hooks/subscrption";
import { gotoPricing } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useMetadata } from "@/hooks/metadata";

export const Upgrade = () => {
  const { t, i18n } = useTranslation();
  const { subscription } = useSubscription();

  const navigate = useNavigate();

  const [upgrade, setUpgradeClose] = usePlayerStore((state) => [
    state.upgrade,
    state.setUpgradeClose,
  ]);
  const userMetadata = useMetadata();
  function handleUpgrade() {
    if (subscription?.attributes.status === "active") {
      setUpgradeClose();
      navigate("/plans");
      return;
    }
    gotoPricing({
      medium: "upgrade_dialog",
      lang: i18n.language,
      provider: userMetadata?.provider,
    });
  }

  return (
    <Dialog open={upgrade.open} onOpenChange={setUpgradeClose}>
      <DialogContent>
        <DialogHeader className="text-xl">
          <DialogTitle>
            {t("dialogs.upgrade.unlock")} {upgrade.feature}
          </DialogTitle>
          <DialogDescription className="text-lg">
            {upgrade.role === "standard"
              ? t("dialogs.upgrade.upgrade_to_standard")
              : t("dialogs.upgrade.upgrade_to_pro")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setUpgradeClose()}>
            {t("Cancel")}
          </Button>
          <Button onClick={handleUpgrade}>
            {t("dialogs.upgrade.see_plans")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

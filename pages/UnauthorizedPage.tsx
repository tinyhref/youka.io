import React, { useMemo } from "react";
import Header from "@/components/Header";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { gotoPricing } from "@/lib/utils";
import { useClerk } from "@clerk/clerk-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMetadata } from "@/hooks/metadata";

export default function UnauthorizedPage() {
  const { t, i18n } = useTranslation();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const userMetadata = useMetadata();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get("reason");
  const [title, description] = useMemo(() => {
    switch (reason) {
      case "many_emails":
        return [
          t("dialogs.global.no_user.title"),
          t("dialogs.global.no_user.many_emails_description"),
        ];

      case "virtual_machine":
        return [
          t("dialogs.global.no_user.title"),
          t("dialogs.global.no_user.virtual_machine_description"),
        ];
      default:
        return [
          t("dialogs.global.no_user.title"),
          t("dialogs.global.no_user.description"),
        ];
    }
  }, [reason, t]);

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <>
      <div>
        <Header hideLogo />
        <div className="flex flex-col h-screen-minus-40 items-center justify-center text-xl gap-4">
          <div className="font-bold">{title}</div>
          <div className="w-[50%]">{description}</div>
          <div className="flex flex-row gap-4 mt-4">
            <Button
              onClick={() =>
                gotoPricing({
                  medium: "unauthorized_page",
                  lang: i18n.language,
                  provider: userMetadata?.provider,
                })
              }
            >
              {t("Upgrade")}
            </Button>
            <Button onClick={handleSignOut} variant="outline">
              {t("Sign Out")}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAt,
  faBarcode,
  faCalendar,
  faCartShopping,
  faCircleUser,
  faCloudArrowUp,
  faHashtag,
  faSignIn,
  faSignOut,
  faUser,
  faVoteYea,
} from "@fortawesome/free-solid-svg-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClerk, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { RoleTitle } from "@/types";
import { gotoCustomerPortal, gotoPricing } from "@/lib/utils";
import useSubscription from "@/hooks/subscrption";
import { ipcRenderer, shell } from "electron";
import { usePlayerStore } from "@/stores/player";
import client from "@/lib/client";
import { useMetadata } from "@/hooks/metadata";

export function Profile() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { isSignedIn, user } = useUser();

  let [role, creditsData] = usePlayerStore((state) => [
    state.role,
    state.creditsData,
  ]);
  const userMetadata = useMetadata();
  const { subscription } = useSubscription();
  const [version, setVersion] = useState<string>();

  const iconClassName = "mr-2 h-4 w-4";

  useEffect(() => {
    async function init() {
      try {
        const version = await ipcRenderer.invoke("version");
        if (version) {
          setVersion(version);
        }
      } catch {}
    }
    init();
  }, []);

  async function handleClickBilling() {
    if (!subscription) return;
    const subscription2 = await client.subscription(subscription.id);
    gotoCustomerPortal(subscription2);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex flex-col h-full items-center">
          <FontAwesomeIcon
            icon={faCircleUser}
            className="cursor-pointer w-[40px] h-[40px]"
          />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        {user?.primaryEmailAddress && (
          <DropdownMenuItem disabled>
            <FontAwesomeIcon icon={faAt} className={iconClassName} />
            {user.primaryEmailAddress.emailAddress}
          </DropdownMenuItem>
        )}
        {role && (
          <DropdownMenuItem>
            <FontAwesomeIcon icon={faUser} className={iconClassName} />
            <div className="flex flex-row w-full items-center justify-between">
              <div>
                <span>
                  {
                    // @ts-ignore
                    t(RoleTitle[role], { defaultValue: "" })
                  }
                </span>
              </div>
            </div>
          </DropdownMenuItem>
        )}
        {creditsData !== undefined && (
          <DropdownMenuItem>
            <FontAwesomeIcon icon={faCartShopping} className={iconClassName} />
            <div className="flex flex-row items-center gap-2">
              {t("Credits")}

              {creditsData.used === undefined ? (
                <span>{creditsData.remaining}</span>
              ) : (
                <span>
                  {creditsData.used} / {creditsData.limit}
                </span>
              )}
            </div>
          </DropdownMenuItem>
        )}
        {creditsData !== undefined && creditsData.resetDays !== undefined && (
          <DropdownMenuItem>
            <FontAwesomeIcon icon={faCalendar} className={iconClassName} />
            Credits reset in {creditsData.resetDays} days
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {(role === "trial" || role === "none" || role === "trial-expired") && (
          <DropdownMenuItem
            onClick={() =>
              gotoPricing({
                medium: "profile_upgrade_button",
                lang: i18n.language,
                provider: userMetadata?.provider,
              })
            }
          >
            <FontAwesomeIcon icon={faCloudArrowUp} className={iconClassName} />
            {t("Upgrade")}
          </DropdownMenuItem>
        )}

        {["basic", "standard", "pro", "payperuse"].includes(role!) &&
          subscription && (
            <DropdownMenuItem onClick={handleClickBilling}>
              <FontAwesomeIcon icon={faBarcode} className={iconClassName} />
              {t("Billing")}
            </DropdownMenuItem>
          )}

        <DropdownMenuItem
          onClick={() => shell.openExternal("https://youka.canny.io/features")}
        >
          <FontAwesomeIcon icon={faVoteYea} className={iconClassName} />
          <span>{t("Feature Voting")}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {isSignedIn ? (
          <DropdownMenuItem
            onClick={async () => {
              await signOut();
              navigate("/");
            }}
          >
            <FontAwesomeIcon icon={faSignOut} className={iconClassName} />
            <span>{t("Sign Out")}</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => {
              navigate("/");
            }}
          >
            <FontAwesomeIcon icon={faSignIn} className={iconClassName} />
            <span>{t("Sign In")}</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem disabled>
          <FontAwesomeIcon icon={faHashtag} className={iconClassName} />
          {version && <span className="mr-2">{version}</span>}
          <span>{process.env.REACT_APP_GIT_SHA || "Development"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

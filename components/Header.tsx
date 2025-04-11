import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Profile } from "@/components/Profile";
import { Logo } from "@/components/Logo";
import { FreeSpaceStatus } from "@/components/FreeSpaceStatus";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@/components/ui/button";
import NotificationsPopover from "./popovers/Notifications";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn, gotoPricing } from "@/lib/utils";
import {
  faArrowLeft,
  faArrowRight,
  faBook,
  faBookBookmark,
  faBullhorn,
  faGear,
} from "@fortawesome/free-solid-svg-icons";
import { LangSelector } from "./LangSelector";
import { usePlayerStore } from "@/stores/player";
import { useSettingsStore } from "@/stores/settings";
import { InternetStatus } from "./InternetStatus";
import { shell } from "electron";
import { useTheme } from "next-themes";
import * as report from "@/lib/report";
import { useAuth, useUser } from "@clerk/clerk-react";
import { HeaderMenu } from "./HeaderMenu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { FaqMenu } from "./FaqMenu";
import { useMetadata } from "@/hooks/metadata";
import { VideoGuidesMenu } from "./VideoGuidesMenu";

export interface HeaderBreadcrumb {
  label: string;
  url: string;
}

interface Props {
  hideLogo?: boolean;
  showNav?: boolean;
  showMenu?: boolean;
  showProfile?: boolean;
  showNotifications?: boolean;
  showLang?: boolean;
  showSettings?: boolean;
  showFaq?: boolean;
  showLibrary?: boolean;
  showDocs?: boolean;
  showChangelog?: boolean;
  showSpace?: boolean;
  showInternetStatus?: boolean;
  showVideoGuides?: boolean;
  children?: React.ReactNode;
  className?: string;
  breadcrumbs?: HeaderBreadcrumb[];
}

export default function Header({
  hideLogo,
  showNav,
  showMenu,
  showProfile,
  showNotifications,
  showLang,
  showSettings,
  showFaq,
  showVideoGuides,
  showLibrary,
  showSpace,
  showDocs,
  showChangelog,
  showInternetStatus,
  children,
  className,
  breadcrumbs,
}: Props) {
  const { t, i18n } = useTranslation();
  const { resolvedTheme } = useTheme();
  const { isSignedIn } = useAuth();
  const [
    role,
    creditsData,
    setTab,
    refreshCreditsData,
    refreshRole,
  ] = usePlayerStore((state) => [
    state.role,
    state.creditsData,
    state.setTab,
    state.refreshCreditsData,
    state.refreshRole,
  ]);
  const [libraryPath, lang, checkAbuse] = useSettingsStore((state) => [
    state.libraryPath,
    state.lang,
    state.checkAbuse,
  ]);
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const userMetadata = useMetadata();

  useEffect(() => {
    if (location.pathname === "/" || location.pathname === "/unauthorized")
      return;

    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return;

    const { abused, reason } = checkAbuse(email, role);
    if (abused) {
      report.error("abuse", { email });
      navigate(`/unauthorized?reason=${reason}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.primaryEmailAddress, role, location.pathname]);

  useEffect(() => {
    // @ts-ignore
    Canny("initChangelog", {
      appID: "644510e70ce853090acea0e0",
      position: "bottom",
      align: "left",
      theme: resolvedTheme === "dark" ? "dark" : "light",
    });
  }, [resolvedTheme]);

  useEffect(() => {
    if (showProfile && !creditsData) {
      refreshCreditsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showProfile, creditsData]);

  useEffect(() => {
    if (!role && isSignedIn) {
      refreshRole();
    }
  }, [role, refreshRole, isSignedIn]);

  return (
    <div
      className={cn(
        "sticky top-0 flex flex-row justify-between items-center p-4 bg-background z-50 overflow-x-clip select-none",
        className
      )}
    >
      <div className="flex flex-row items-center gap-2">
        {!hideLogo && <Logo />}

        {breadcrumbs && (
          <div className="flex flex-row items-center">
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.slice(0, -1).map((breadcrumb) => (
                  <div
                    key={breadcrumb.url}
                    className="flex flex-row items-center gap-2"
                  >
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to={breadcrumb.url}>{breadcrumb.label}</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                  </div>
                ))}
                {breadcrumbs.length > 0 && (
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      {breadcrumbs[breadcrumbs.length - 1].label}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        )}

        {showNav && (
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={() => navigate(-1)}>
                  <FontAwesomeIcon icon={faArrowLeft} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("Go back")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="ml-2"
                  variant="outline"
                  onClick={() => navigate(+1)}
                >
                  <FontAwesomeIcon icon={faArrowRight} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("Go forward")}</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>

      <div className="flex flex-row items-center justify-end gap-2">
        {showInternetStatus && <InternetStatus checkInterval={1000 * 60} />}
        {showSpace && (
          <FreeSpaceStatus
            path={libraryPath}
            min={1}
            checkInterval={1000 * 60}
          />
        )}

        {creditsData && !creditsData.hasCredits && (
          <div className="whitespace-nowrap overflow-ellipsis">
            <Button
              variant="destructive"
              onClick={() =>
                gotoPricing({
                  medium: "header_credits_over_button",
                  provider: userMetadata?.provider,
                  lang: i18n.language,
                })
              }
            >
              {t("Credits are over! Click to buy more")}
            </Button>
          </div>
        )}

        {showMenu && <HeaderMenu />}

        {showLibrary && (
          <Button
            variant="outline"
            onClick={() => {
              setTab("library");
              navigate("/player");
            }}
          >
            <FontAwesomeIcon className="mr-2" icon={faBookBookmark} />
            {t("Library")}
          </Button>
        )}

        {showFaq && <FaqMenu />}

        {showVideoGuides && <VideoGuidesMenu />}

        {showDocs && (
          <Button
            variant="outline"
            onClick={() => {
              const path = ["en", "pt"].includes(lang)
                ? "docs/"
                : `${lang}/docs/`;
              shell.openExternal(`https://www.youka.io/${path}`);
            }}
          >
            <FontAwesomeIcon className="mr-2" icon={faBook} />
            <div className="whitespace-nowrap">{t("Docs")}</div>
          </Button>
        )}

        {showChangelog && (
          <Button variant="outline" data-canny-changelog>
            <FontAwesomeIcon icon={faBullhorn} />
          </Button>
        )}

        {showNotifications && <NotificationsPopover />}

        {showLang && <LangSelector />}

        {showSettings && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={() => navigate("/settings")}>
                <FontAwesomeIcon icon={faGear} />
                <div className="whitespace-nowrap">{t("Settings")}</div>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("Settings")}</TooltipContent>
          </Tooltip>
        )}

        {children}

        {showProfile && <Profile />}
      </div>
    </div>
  );
}

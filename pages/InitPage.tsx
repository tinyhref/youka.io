import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Logo } from "@/components/Logo";
import installImage from "@/assets/install.jpg";

import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSettingsStore } from "@/stores/settings";
import { Anal } from "@/components/Anal";
import { Eula } from "@/components/Eula";
import { Install } from "@/components/Install";
import { SignIn, SignUp, useAuth } from "@clerk/clerk-react";
import { usePlayerStore } from "@/stores/player";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleRight,
  faGear,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import * as report from "@/lib/report";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { MiniSettings } from "@/components/dialogs/MiniSettings";
import rollbar from "@/lib/rollbar";

type Mode =
  | "install"
  | "eula"
  | "decline"
  | "signin"
  | "signup"
  | "error"
  | "reload"
  | "installed";

export default function InitPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userId, isSignedIn } = useAuth();
  const [
    ready,
    initError,
    refreshRole,
    refreshCreditsData,
  ] = usePlayerStore((state) => [
    state.ready,
    state.error,
    state.refreshRole,
    state.refreshCreditsData,
  ]);
  const [eula, setAcceptEula] = useSettingsStore((state) => [
    state.eula,
    state.setAcceptEula,
  ]);
  const [openSettings, setOpenSettings] = useState(false);
  const [mode, setMode] = useState<Mode>();
  const [error, setError] = useState<string | null>();
  const navigate = useNavigate();

  const baseUrl =
    process.env.NODE_ENV === "production"
      ? "https://app.youka.io"
      : "http://localhost:3000";

  const redirectUrl = `${baseUrl}/?mode=reload`;

  const sentences = [
    {
      sentence:
        "Music gives a soul to the universe, wings to the mind, flight to the imagination and life to everything.",
      name: "Plato",
    },
    {
      sentence: "I don't sing because I'm happy; I'm happy because I sing.",
      name: "William James",
    },
    {
      sentence:
        "Singing is a way of escaping. It's another world. I'm no longer on earth.",
      name: "Edith Piaf",
    },
    {
      sentence: "Music is the universal language of mankind.",
      name: "Henry Wadsworth Longfellow",
    },
    {
      sentence: "Where words fail, music speaks.",
      name: "Hans Christian Andersen",
    },
    { sentence: "You don't need a spotlight to sing karaoke.", name: "Anon" },
    { sentence: "Karaoke is the great equalizer.", name: "Aisha Tyler" },
  ];
  const { sentence, name } = sentences[
    Math.floor(Math.random() * sentences.length)
  ];

  useEffect(() => {
    async function init() {
      if (ready) {
        if (isSignedIn) {
          try {
            await Promise.all([refreshRole(), refreshCreditsData()]);
          } catch (e) {
            rollbar.error("failed to refresh role or credits data", { e });
          }
        }
        navigate("/home");
      } else if (initError) {
        setError(initError.message);
        setMode("error");
      }
    }

    if (mode === "installed") {
      init();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initError, ready, isSignedIn]);

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode) {
      setMode(mode as Mode);
    } else if (!eula) {
      setMode("eula");
    } else if (!userId) {
      setMode("signin");
    } else {
      setMode("install");
    }
  }, [searchParams, eula, userId]);

  function handleAcceptEula() {
    setAcceptEula();

    if (!userId) {
      setSearchParams({ mode: "signin" });
    } else {
      setSearchParams({ mode: "install" });
    }
  }

  function handleDeclineEula() {
    setSearchParams({ mode: "decline" });
  }

  function handleInstallSuccess() {
    setMode("installed");
  }

  function handleInstallFailed(e: Error) {
    report.error(e);
    setError(e.message);
    setMode("error");
  }

  function renderMode() {
    switch (mode) {
      case "reload":
        window.location.href = baseUrl;
        return null;
      case "error":
        return (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("Failed to start Youka")}
            </h1>
            <p className="text-sm text-muted-foreground py-2">{error}</p>
            <Button className="mt-2" onClick={() => window.location.reload()}>
              <FontAwesomeIcon icon={faCircleRight} className="mr-2" />
              {t("Retry")}
            </Button>
          </>
        );
      case "install":
        return (
          <Install
            onSuccess={handleInstallSuccess}
            onFailed={handleInstallFailed}
          />
        );
      case "eula":
        return (
          <Eula onAccept={handleAcceptEula} onDecline={handleDeclineEula} />
        );
      case "signin":
        return (
          <SignIn
            routing="virtual"
            fallbackRedirectUrl={redirectUrl}
            signInUrl="/?mode=signin"
            signUpUrl="/?mode=signup"
            withSignUp={true}
          />
        );
      case "signup":
        return (
          <SignUp
            routing="virtual"
            fallbackRedirectUrl={redirectUrl}
            signInUrl="/?mode=signin"
          />
        );
      case "decline":
        return (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("You need to accept the EULA to use Youka")}
            </h1>
            <Link
              className="text-sm text-muted-foreground py-2"
              to="/?mode=eula"
            >
              {t("Go Back to EULA")}
            </Link>
          </>
        );
      default:
        return <FontAwesomeIcon className="text-2xl" icon={faSpinner} spin />;
    }
  }

  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <div
          className="w-1/2 flex flex-col"
          style={{
            backgroundImage: `url('${installImage}')`,
            backgroundPosition: "center",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="flex flex-col h-screen justify-between p-8">
            <div className="flex self-start">
              <Logo unclickable />
            </div>
            <blockquote className="space-y-2 text-white">
              <p className="text-lg">&ldquo;{sentence}&rdquo;</p>
              <footer className="text-sm">{name}</footer>
            </blockquote>
          </div>
        </div>
        <div className="w-1/2 flex flex-col">
          <Header className="w-full mt-2" hideLogo showNotifications showLang>
            {mode === "error" ? (
              <Button variant="outline" onClick={() => setOpenSettings(true)}>
                <FontAwesomeIcon icon={faGear} className="mr-2" />
                {t("Settings")}
              </Button>
            ) : null}
          </Header>
          <div className="flex-grow flex items-center justify-center mb-20">
            <div className="self-center">{renderMode()}</div>
          </div>
        </div>
      </div>
      {process.env.NODE_ENV === "production" && <Anal />}
      <MiniSettings open={openSettings} onOpenChange={setOpenSettings} />
    </>
  );
}

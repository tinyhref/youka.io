import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import * as library from "@/lib/library";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSettingsStore } from "@/stores/settings";
import { usePlayerStore } from "@/stores/player";
import { shell } from "electron";
import { useUser } from "@clerk/clerk-react";
import { lib } from "@/lib/repo";

interface Props {
  onSuccess: () => void;
  onFailed: (e: Error) => void;
}

export function Install({ onSuccess, onFailed }: Props) {
  const { t, i18n } = useTranslation();
  const { user } = useUser();
  const [progress, setProgress] = useState(0);
  const [initLibrary] = usePlayerStore((state) => [state.initLibrary]);
  const [
    youtubeEnabled,
    welcomeShown,
    setWelcomeShown,
  ] = useSettingsStore((state) => [
    state.youtubeEnabled,
    state.welcomeShown,
    state.setWelcomeShown,
  ]);

  useEffect(() => {
    async function welcome() {
      if (welcomeShown) return;
      const songsCount = await lib.count();
      if (songsCount > 0) {
        setWelcomeShown(true);
        return;
      }
      if (!user) return;
      const email = user.emailAddresses[0].emailAddress;
      const encodedEmail = encodeURIComponent(btoa(email));
      let langPart = "";
      if (i18n.language !== "en") {
        langPart = `/${i18n.language}`;
      }
      shell.openExternal(
        `https://www.youka.io${langPart}/welcome/?action=welcome&user-id=${encodedEmail}`
      );
      setWelcomeShown(true);
    }
    welcome();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, welcomeShown]);

  useEffect(() => {
    async function install() {
      try {
        await library.install(youtubeEnabled, (progress) => {
          setProgress(progress);
        });
        await initLibrary();

        onSuccess();
      } catch (e) {
        // @ts-ignore
        onFailed(e);
      }
    }
    install();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("Preparing Youka")}
        <FontAwesomeIcon className="ml-2 text-lg" icon={faSpinner} spin />
      </h1>
      <p className="text-sm text-muted-foreground py-2">{progress}%</p>
    </div>
  );
}

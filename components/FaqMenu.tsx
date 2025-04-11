import React from "react";

import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { shell } from "electron";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export function FaqMenu() {
  const { t, i18n } = useTranslation();

  let lang = i18n.language;
  if (lang === "zh") {
    lang = "zh-hans";
  }
  let prefix: string;
  if (lang === "en") {
    prefix = "https://www.youka.io/docs";
  } else {
    prefix = `https://www.youka.io/${lang}/docs`;
  }

  const QAs: { title: string; path: string }[] = [
    {
      title: t("How to Edit the lyrics"),
      path: "/edit-the-lyrics/",
    },
    {
      title: t("How to Fix the Sync"),
      path: "/fix-the-sync/",
    },
    {
      title: t("How to Keep Choirs"),
      path: "/how-to-keep-choirs-background-vocals-in-your-karaoke-tracks/",
    },
    {
      title: t("How to Trim a Karaoke Video"),
      path: "/how-to-trim-a-karaoke-video/",
    },
    {
      title: t("How to Add a Line Break"),
      path: "/how-to-add-a-line-break/",
    },
    {
      title: t("How to Set Up a Duet"),
      path: "/how-to-set-up-a-duet/",
    },
    {
      title: t("How to Change the Background Video"),
      path: "/how-to-change-the-background-video/",
    },
    {
      title: t("How to Adjust the Line Length"),
      path: "/adjusting-line-length/",
    },

    {
      title: t("How to Center Subtitles"),
      path: "/how-to-center-subtitles/",
    },
    {
      title: t("How to Delete a Karaoke"),
      path: "/delete-a-karaoke/",
    },

    {
      title: t("How to Keep the Original Singer’s Voice"),
      path: "/how-to-keep-the-original-singers-voice/",
    },
    {
      title: t("How to Speed Up the Download Process"),
      path: "/how-to-speed-up-the-download-process/",
    },
    {
      title: t("How to Transfer Your Karaoke Library to a New Computer"),
      path: "/switch-to-a-new-computer/",
    },
    {
      title: t("How to Add a Background Black Box to Subtitles"),
      path: "/how-to-add-a-background-black-box-to-subtitles/",
    },
    {
      title: t("How to Cancel Your Subscription"),
      path: "/how-to-cancel-your-subscription/",
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <FontAwesomeIcon icon={faQuestionCircle} />
          {t("FAQ")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {QAs.map((qa) => (
          <DropdownMenuItem
            key={qa.path}
            onClick={() => {
              shell.openExternal(
                `${prefix}${qa.path}?utm_source=youka_desktop`
              );
            }}
          >
            {qa.title}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

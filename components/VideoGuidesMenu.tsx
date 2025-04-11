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
import { faPlayCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export function VideoGuidesMenu() {
  const { t } = useTranslation();

  const videos: { title: string; url: string }[] = [
    {
      title: t("Quick Start Guide"),
      url: "https://www.youtube.com/watch?v=B4Z4VvUsD-Q",
    },
    {
      title: t("Lyrics Sync Guide"),
      url: "https://www.youtube.com/watch?v=0SjmtENMt6Y",
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <FontAwesomeIcon icon={faPlayCircle} />
          {t("Video Guides")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {videos.map((video) => (
          <DropdownMenuItem
            key={video.url}
            onClick={() => {
              shell.openExternal(video.url);
            }}
          >
            {video.title}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import React, { useState } from "react";
import Header from "@/components/Header";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Trim } from "@/components/Trim";
import { TrimChange } from "@/components/Trim";
import useSong from "@/hooks/song";
import { usePlayerStore } from "@/stores/player";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "next-themes";
import { OutputTrim, Theme } from "@/types";

export default function TrimPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { songId } = useParams();
  const [trim] = usePlayerStore((state) => [state.trim]);
  const selectByGroupId = usePlayerStore((state) => state.selectByGroupId);
  const updateSong = usePlayerStore((state) => state.updateSong);
  const { resolvedTheme } = useTheme();

  const song = useSong(songId);
  const [trimParams, setTrimParams] = useState<TrimChange | null>(null);
  const [trimming, setTrimming] = useState(false);

  function handleTrim() {
    if (!trimParams) return;
    setTrimming(true);
    const job = trim(trimParams);
    job.on("output", async ({ song, groupId }: OutputTrim) => {
      updateSong(song.id, song);
      await selectByGroupId(song.id, groupId);
      navigate(`/player?sid=${song.id}`);
      setTrimming(false);
    });
  }

  if (!song) return null;

  return (
    <>
      <Header
        breadcrumbs={[
          {
            label: t("Home"),
            url: "/home",
          },
          {
            label: t("Library"),
            url: "/player",
          },
          {
            label: song?.title,
            url: `/player?sid=${song?.id}`,
          },
          {
            label: t("dialogs.trim.title"),
            url: `/trim/${song.id}`,
          },
        ]}
      >
        <div className="flex flex-row gap-2">
          <Button
            disabled={trimming}
            variant="outline"
            onClick={() => navigate(-1)}
          >
            {t("Cancel")}
          </Button>
          <Button onClick={handleTrim} disabled={trimming}>
            {t("dialogs.trim.title")}
            {trimming && (
              <FontAwesomeIcon icon={faSpinner} spin className="ml-2" />
            )}
          </Button>
        </div>
      </Header>
      {!trimming && (
        <div className="w-60vw">
          {song && (
            <Trim
              song={song}
              onChange={setTrimParams}
              theme={(resolvedTheme as Theme) || "light"}
            />
          )}
        </div>
      )}
    </>
  );
}

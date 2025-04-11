import React, { useEffect, useMemo, useRef, useState } from "react";
import Header, { HeaderBreadcrumb } from "@/components/Header";
import { Player } from "@/components/Player";
import { PlayerSidebar } from "@/components/PlayerSidebar";
import { usePlayerStore } from "@/stores/player";
import { useSearchParams } from "react-router-dom";
import { Menu } from "@/components/player/Menu";
import { Upgrade } from "@/components/dialogs/Upgrade";
import { JobStatus } from "@/components/JobStatus";
import { Button } from "@/components/ui/button";
import { EditLyrics } from "@/components/dialogs/EditLyrics";
import { useTranslation } from "react-i18next";
import {
  faArrowUpRightFromSquare,
  faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import { BrowserWindow } from "@electron/remote";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import icon from "../icon";
import { useSettingsStore } from "@/stores/settings";
import Title from "@/components/player/Title";
import { formatSongTitle, getNewBPM, transposeKey } from "@/lib/utils";

export default function PlayerPage() {
  const [
    stop,
    playSong,
    setSelectedAlignment,
    jobs,
    song2job,
    pause,
    play,
    dualScreenOpen,
    setDualScreenOpen,
    ready,
    role,
    creditsData,
    pitch,
    tempo,
  ] = usePlayerStore((state) => [
    state.stop,
    state.playSong,
    state.setSelectedAlignment,
    state.jobs,
    state.song2job,
    state.pause,
    state.play,
    state.dualScreenOpen,
    state.setDualScreenOpen,
    state.ready,
    state.role,
    state.creditsData,
    state.pitch,
    state.tempo,
  ]);
  const { t } = useTranslation();
  const [localTempo, setLocalTempo] = useState<number | undefined>(undefined);
  const [localKey, setLocalKey] = useState<string | undefined>(undefined);
  const [breadcrumbs, setBreadcrumbs] = useState<HeaderBreadcrumb[]>([]);
  const song = usePlayerStore((state) => state.songs[state.songId]);
  const [dualScreenBounds, setDualScreenBounds] = useSettingsStore((state) => [
    state.dualScreenBounds,
    state.setDualScreenBounds,
  ]);
  const [editLyricsOpen, setEditLyricsOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const dualPlayerRef = useRef<any>(null);

  const hasAlignment = useMemo(
    () => song?.status === "processed" && song.alignments2?.length,
    [song]
  );
  const hasOriginal = useMemo(
    () =>
      song?.status === "processed" &&
      song.stems.some((s) => s.modelId === "original"),
    [song]
  );

  const sid = searchParams.get("sid");
  const qid = searchParams.get("qid");
  const aid = searchParams.get("aid");
  const random = searchParams.get("random");

  useEffect(() => {
    if (song?.status === "processed" && song.analysis) {
      setLocalKey(transposeKey(song.analysis.keyIndex, pitch));
    }
  }, [song, pitch]);

  useEffect(() => {
    if (song?.status === "processed" && song.analysis) {
      setLocalTempo(Math.round(getNewBPM(song.analysis.bpm, tempo)));
    }
  }, [song, tempo]);

  useEffect(() => {
    const breadcrumbs = [
      {
        label: t("Home"),
        url: "/home",
      },
      {
        label: t("Library"),
        url: "/player",
      },
    ];
    if (song) {
      breadcrumbs.push({
        label: formatSongTitle(song),
        url: `/player?sid=${song.id}`,
      });
    }
    setBreadcrumbs(breadcrumbs);
  }, [song, t]);

  useEffect(() => {
    if (!ready) return;
    if (sid) {
      playSong(sid, qid);
    } else {
      stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, sid, qid, random]);

  useEffect(() => {
    return () => {
      handleCloseDualPlayer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleOpenDualPlayer() {
    pause();

    const dualPlayerWindow = new BrowserWindow({
      width: dualScreenBounds.width,
      height: dualScreenBounds.height,
      x: dualScreenBounds.x,
      y: dualScreenBounds.y,
      icon,
      webPreferences: {
        contextIsolation: false,
        webSecurity: false,
        nodeIntegration: true,
      },
      alwaysOnTop: true,
    });
    dualPlayerWindow.removeMenu();
    dualPlayerWindow.on("close", () => {
      setDualScreenOpen(false);
    });
    dualPlayerWindow.on("resized", () => {
      const bounds = dualPlayerWindow.getBounds();
      setDualScreenBounds({
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
      });
    });
    dualPlayerWindow.on("moved", () => {
      const bounds = dualPlayerWindow.getBounds();
      setDualScreenBounds({
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
      });
    });
    const url = new URL(window.location.href);
    url.pathname = "/dual-player";
    await dualPlayerWindow.loadURL(url.toString());
    dualPlayerWindow.show();
    dualPlayerWindow.focus();
    dualPlayerRef.current = dualPlayerWindow;
    setDualScreenOpen(true);

    setTimeout(() => {
      play();
    }, 1500);
  }

  function handleCloseDualPlayer() {
    if (dualPlayerRef.current) {
      try {
        dualPlayerRef.current.close();
      } catch (e) {
        console.error(e);
      }
    }
  }

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  useEffect(() => {
    if (aid) {
      setSelectedAlignment(aid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aid]);

  const showMenu = role && creditsData?.hasCredits;

  return (
    <div className="h-screen">
      <Header
        breadcrumbs={breadcrumbs}
        showProfile
        showMenu={showMenu}
        showSettings
        showSpace
        showInternetStatus
        showFaq
        showVideoGuides
      />
      <div className="flex flex-row w-full items-center justify-center">
        {song?.status === "processed" && (
          <EditLyrics
            song={song}
            open={editLyricsOpen}
            onOpenChange={setEditLyricsOpen}
          />
        )}
        <div className="flex flex-row w-full max-w-[1500px]">
          <div className="flex flex-col mx-4 w-[67%] min-w-[600px]">
            <Player />

            <div className="w-full flex flex-col mt-2">
              <div className="flex flex-row items-center justify-between mb-2">
                <div className="flex flex-row items-center gap-2">
                  <div className="max-w-[600px] truncate self-start">
                    <Title song={song} />
                  </div>

                  {song?.id && song.status !== "processed" && (
                    <div className="mx-4">
                      <JobStatus
                        job={jobs[song2job[song?.id]]}
                        showProgressOutside
                      />
                    </div>
                  )}
                </div>

                {song?.status === "processed" && song.analysis && (
                  <div className="flex flex-row gap-6">
                    <div className="flex flex-row gap-2 items-center">
                      <div className="font-medium">BPM</div>
                      <div className="dark:text-gray-400">{localTempo}</div>
                    </div>
                    <div className="flex flex-row gap-2 items-center">
                      <div className="font-medium">{t("Key")}</div>
                      <div className="dark:text-gray-400">{localKey}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-row justify-between flex-wrap gap-2">
                <Menu />

                {song &&
                  song.status === "processed" &&
                  !hasAlignment &&
                  hasOriginal && (
                    <Button
                      color="red"
                      variant="destructive"
                      onClick={() => setEditLyricsOpen(true)}
                    >
                      {t("Add Lyrics")}
                    </Button>
                  )}
                {song && song.status === "processed" && (
                  <div>
                    {dualScreenOpen ? (
                      <Button onClick={handleCloseDualPlayer} variant="outline">
                        <FontAwesomeIcon
                          icon={faCircleXmark}
                          className="mr-2"
                        />
                        {t("Close Dual Screen")}
                      </Button>
                    ) : (
                      <Button onClick={handleOpenDualPlayer} variant="outline">
                        <FontAwesomeIcon
                          icon={faArrowUpRightFromSquare}
                          className="mr-2"
                        />
                        {t("Open Dual Screen")}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mr-4 w-[33%] min-w-[450px]">
            <PlayerSidebar />
          </div>
        </div>
      </div>
      <Upgrade />
    </div>
  );
}

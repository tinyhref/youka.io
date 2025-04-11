import React, { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import { WordLevelSync } from "@/components/WordLevelSync";
import { Alignment3, Theme } from "@/types";
import { usePlayerStore } from "@/stores/player";
import { useNavigate, useParams } from "react-router-dom";
// import * as report from "@/lib/report";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/use-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { alignment2ToAlignment3 } from "@/lib/alignment";
import { getCustomAlignment, getPeaks, safeFileUrl } from "@/lib/library";
import { SongStemModelSelect } from "@/components/SongStemModelSelect";
import useSong from "@/hooks/song";
import { SongSubtitlesSelect } from "@/components/SongSubtitlesSelect";
import { SongStemSelect } from "@/components/SongStemSelect";
import { useTheme } from "next-themes";
import { Loader } from "@/components/Loader";
import { formatSongTitle } from "@/lib/utils";

export default function WordLevelSyncPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  let { songId } = useParams();
  const [updateAlignment, selectedAlignment] = usePlayerStore((state) => [
    state.updateAlignment,
    state.selectedAlignment,
  ]);
  const { resolvedTheme } = useTheme();
  const [audioUrl, setAudioUrl] = useState<string>();
  const [peaks, setPeaks] = useState<number[]>();
  const [alignment, setAlignment] = useState<Alignment3>();
  const [newAlignment, setNewAlignment] = useState<Alignment3>();
  // const [isChanged, setIsChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stemModelId, setStemModelId] = useState<string>("");
  const updateSegments = useRef(false);
  const [alignmentId, setAlignmentId] = useState<string>(
    selectedAlignment?.id || ""
  );
  const [showPreservedWords, setShowPreservedWords] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [peaksReady, setPeaksReady] = useState<boolean>(false);
  const [stemId, setStemId] = useState<string>("");
  const song = useSong(songId);

  useEffect(() => {}, [song]);

  useEffect(() => {
    if (!song) return;
    const hasVocalsStem = song.stems.some((s) => s.type === "vocals");
    setShowPreservedWords(hasVocalsStem);
  }, [song]);

  useEffect(() => {
    if (!song || stemId) return;

    let stem = song.stems.find(
      (stem) => stem.type === "original" || stem.type === "vocals"
    );
    if (!stem) {
      stem = song.stems[0];
    }

    if (stem) {
      setStemId(stem.id);
      setStemModelId(stem.modelId);
    }
  }, [song, stemId]);

  useEffect(() => {
    if (!song) return;
    const stem = song.stems.find((s) => s.id === stemId);
    const alignment = song.alignments2?.find((a) => a.id === alignmentId);
    if (!stem || !alignment) return;

    if (stem.groupId && !alignment.groupId) {
      const alignment = song?.alignments2?.find(
        (a) => a.groupId === stem.groupId
      );
      if (alignment) {
        setAlignmentId(alignment.id);
      }
    } else if (!stem.groupId && alignment.groupId) {
      const alignment2 = song?.alignments2?.find(
        (a) => a.groupId === alignment.groupId
      );
      if (alignment2) {
        setAlignmentId(alignment2.id);
      }
    }
  }, [song, stemId, alignmentId]);

  useEffect(() => {
    if (!song) return;
    const currentStem = song.stems.find((s) => s.id === stemId);
    if (currentStem?.modelId === stemModelId) return;
    const stem = song.stems.find((s) => s.modelId === stemModelId);
    if (stem) {
      setStemId(stem.id);
    }
  }, [song, stemModelId, stemId]);

  useEffect(() => {
    if (!song) return;
    const alignment =
      song.alignments2?.find((a) => a.id === alignmentId) ||
      song.alignments2?.[0];

    if (alignment) {
      setAlignmentId(alignment.id);
    }
  }, [alignmentId, song]);

  useEffect(() => {
    if (!song || !alignmentId || alignment?.id === alignmentId) return;
    const currAlignment = song.alignments2?.find((a) => a.id === alignmentId);
    if (currAlignment) {
      setAlignment(alignment2ToAlignment3(currAlignment));
    }
  }, [song, alignmentId, alignment]);

  useEffect(() => {
    if (!song || !stemId) return;
    const stem = song.stems.find((s) => s.id === stemId);
    if (stem) {
      setAudioUrl(safeFileUrl(stem.filepath));
    }
  }, [song, stemId]);

  useEffect(() => {
    async function initPeaks() {
      if (!song) return;
      let stem;
      if (song.selectedVocals) {
        stem = song.stems.find((s) => s.id === song.selectedVocals);
      } else {
        stem = song.stems.find((s) => s.type === "original");
      }
      if (!stem) return;
      const peaks = await getPeaks(song.id, stem.id);
      setPeaks(peaks);
      setPeaksReady(true);
    }
    initPeaks();
  }, [song]);

  // useEffect(() => {
  //   const interval = setInterval(async () => {
  //     if (songId && alignmentId && newAlignment && isChanged) {
  //       try {
  //         setSaving(true);
  //         await updateAlignment(
  //           songId,
  //           getCustomAlignment(newAlignment),
  //           false
  //         );
  //         await new Promise((resolve) => setTimeout(resolve, 1000));
  //         setIsChanged(false);
  //       } catch (e) {
  //         report.error(e as Error);
  //       } finally {
  //         setSaving(false);
  //       }
  //     }
  //   }, 30 * 1000);

  //   return () => clearInterval(interval);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [songId, alignmentId, newAlignment, isChanged]);

  function handleChange(alignment: Alignment3) {
    try {
      setDisabled(true);
      setNewAlignment(structuredClone(alignment));
      // setIsChanged(true);
    } catch (e) {
      console.error(e);
    }
  }

  function handleUpdateSegments() {
    updateSegments.current = true;
  }

  function handleCancel() {
    navigate(-1);
  }

  async function handleSave() {
    try {
      if (!newAlignment || !songId || !alignment) {
        navigate(-1);
        return;
      }
      setSaving(true);

      const customAlignment = getCustomAlignment(newAlignment, "custom");
      const updateServer = !Boolean(newAlignment.groupId);

      await updateAlignment(
        songId,
        customAlignment,
        updateServer,
        updateSegments.current,
        stemModelId
      );

      toast({
        variant: "success",
        title: "Subtitles saved successfully",
      });
      navigate(`/player?sid=${songId}&aid=${customAlignment.id}`);
    } catch (e) {
      if (e instanceof Error) {
        toast({
          variant: "destructive",
          title: "Error saving subtitles",
          description: e.message,
        });
      }
    } finally {
      setSaving(false);
    }
  }

  if (!song || !alignment) return <Header showNav />;

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
            label: formatSongTitle(song),
            url: `/player?sid=${song.id}`,
          },
          {
            label: `${t("Manual Sync")} (${t("Legacy")})`,
            url: `/sync-word/${song.id}`,
          },
        ]}
      >
        <div className="flex flex-row items-center gap-x-2">
          <div className="flex flex-row gap-x-2">
            <Button variant="outline" onClick={handleCancel}>
              {t("Cancel")}
            </Button>
            <Button disabled={saving} onClick={handleSave}>
              {t("Save")}
              {saving && (
                <FontAwesomeIcon className="ml-2" icon={faSpinner} spin />
              )}
            </Button>
          </div>
        </div>
      </Header>
      <div className="flex flex-col items-center">
        <div className="flex flex-row gap-2">
          <SongStemModelSelect
            withLabel
            song={song}
            value={stemModelId}
            onValueChange={setStemModelId}
            omit={["custom"]}
            disabled={disabled}
          />
          <SongStemSelect
            withLabel
            song={song}
            modelId={stemModelId}
            value={stemId}
            onValueChange={setStemId}
            disabled={disabled}
          />
          <SongSubtitlesSelect
            withLabel
            song={song}
            value={alignmentId}
            onValueChange={setAlignmentId}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="h-[60vh] m-8 flex flex-col justify-center">
        {audioUrl && peaksReady ? (
          <WordLevelSync
            audioUrl={audioUrl}
            peaks={peaks}
            alignment={alignment}
            onChange={handleChange}
            onUpdateSegments={handleUpdateSegments}
            showPreservedWords={showPreservedWords}
            theme={(resolvedTheme as Theme) || "light"}
          />
        ) : (
          <div className="flex flex-col items-center justify-center">
            <Loader />
          </div>
        )}
      </div>
    </>
  );
}

import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import {
  Alignment2,
  Alignment3,
  Resolution,
  SingerToStyleOptionsMapping,
  SubtitlesPreset,
  Theme,
} from "@/types";
import { usePlayerStore } from "@/stores/player";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import {
  alignment2ToAlignment3,
  syncAlignmentToAlignment2,
} from "@/lib/alignment";
import {
  getCustomAlignment,
  getVideoWithAudio,
  getVideoResolution,
  safeFileUrl,
  getPeaks,
} from "@/lib/library";
import useSong from "@/hooks/song";
import { SongSubtitlesSelect } from "@/components/SongSubtitlesSelect";
import { randomUUID } from "crypto";
import { SyncTool } from "@/components/SyncTool/SyncTool";
import { SyncAlignment } from "@/components/SyncTool/types";
import { toast } from "@/components/ui/use-toast";
import { Fallback } from "@/components/Fallback";
import rollbar from "@/lib/rollbar";
import { DefaultVideoResolution } from "@/consts";
import { formatSongTitle } from "@/lib/utils";
import { useTheme } from "next-themes";
export default function ManualSyncPage() {
  const { t } = useTranslation();
  const [
    selectedAlignment,
    selectedVideo,
    updateAlignment,
    getSubtitlesPreset,
    getStyleOptionsMapping,
  ] = usePlayerStore((state) => [
    state.selectedAlignment,
    state.selectedVideo,
    state.updateAlignment,
    state.getSubtitlesPreset,
    state.getStyleOptionsMapping,
  ]);
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();
  let { songId } = useParams();
  const song = useSong(songId);
  const [videoUrl, setVideoUrl] = useState<string>();
  const [audioUrl, setAudioUrl] = useState<string>();
  const [alignmentId, setAlignmentId] = useState<string>(
    selectedAlignment?.id || ""
  );
  const [alignment, setAlignment] = useState<SyncAlignment>();
  const [alignment2, setAlignment2] = useState<Alignment2>();
  const [newAlignment, setNewAlignment] = useState<SyncAlignment>();
  const [saving, setSaving] = useState(false);
  const [resolution, setResolution] = useState<Resolution>(
    DefaultVideoResolution
  );
  const [subtitlesPreset, setSubtitlesPreset] = useState<SubtitlesPreset>();
  const [styleOptionsMapping, setStyleOptionsMapping] = useState<
    SingerToStyleOptionsMapping
  >();
  const [peaks, setPeaks] = useState<number[][]>([]);

  const disabled = false;

  useEffect(() => {
    async function fetchPeaks() {
      if (!song) return;
      let stem;
      if (song.selectedVocals) {
        stem = song.stems.find((s) => s.id === song.selectedVocals);
      } else {
        stem = song.stems.find((s) => s.type === "original");
      }
      if (!stem) return;
      const peaks = await getPeaks(song.id, stem.id);

      if (!peaks) return;
      setPeaks([peaks]);
    }
    fetchPeaks();
  }, [song]);

  useEffect(() => {
    if (!song) return;
    setSubtitlesPreset(getSubtitlesPreset(song.id));
    setStyleOptionsMapping(getStyleOptionsMapping(song.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song]);

  useEffect(() => {
    async function fetchVideo() {
      if (!song) return;
      const originalStem = song.stems?.find((s) => s.type === "original");
      if (!originalStem) return;
      setAudioUrl(safeFileUrl(originalStem.filepath));
      let video = selectedVideo;
      if (!video) {
        video = song.videos?.[0];
      }
      if (!video) return;
      try {
        const videoUrl = await getVideoWithAudio(
          song.id,
          video.id,
          originalStem.id
        );
        const resolution = await getVideoResolution(song, video.id);
        setResolution(resolution);
        setVideoUrl(safeFileUrl(videoUrl));
      } catch (e) {
        rollbar.error("Error fetching video", {
          songId: song.id,
          error: e,
        });
        navigate(-1);
      }
    }
    fetchVideo();
  }, [song, selectedVideo, navigate]);

  useEffect(() => {
    if (!song) return;

    let alignment;

    if (alignmentId) {
      alignment = song.alignments2?.find((a) => a.id === alignmentId);
    }

    if (!alignment) {
      alignment = song.alignments2?.[0];
    }

    if (alignment) {
      setAlignment2(alignment);
      setAlignment(alignmentWithId(alignment2ToAlignment3(alignment)));
      setAlignmentId(alignment.id);
    }
  }, [song, alignmentId]);

  if (!song) return <div>Song not found</div>;

  async function handleSave() {
    try {
      if (!newAlignment || !songId || !alignment || !alignment2) {
        navigate(-1);
        return;
      }
      setSaving(true);

      const newAlignment2 = syncAlignmentToAlignment2(newAlignment, alignment2);
      const newAlignment3 = alignment2ToAlignment3(newAlignment2);

      const customAlignment = getCustomAlignment(newAlignment3, "custom");
      const updateServer = !Boolean(newAlignment3.groupId);

      await updateAlignment(songId, customAlignment, updateServer);

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

  function handleCancel() {
    navigate(-1);
  }

  function handleChange(alignment: SyncAlignment) {
    setNewAlignment(alignment);
  }

  function alignmentWithId(alignment: Alignment3): SyncAlignment {
    const alignments = {
      ...alignment,
      lines: alignment.lines.map((line) => {
        const lineId = randomUUID();
        return {
          ...line,
          lineId,
          words: line.words.map((word) => {
            const wordId = randomUUID();
            return {
              ...word,
              lineId,
              wordId,
              subwords: word.subwords.map((subword) => ({
                ...subword,
                lineId,
                wordId,
                subwordId: randomUUID(),
              })),
            };
          }),
        };
      }),
    };

    return alignments;
  }

  if (!videoUrl) return <Fallback />;

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
            label: t("Manual Sync"),
            url: `/manual-sync/${song.id}`,
          },
        ]}
      >
        <div className="flex flex-row items-center gap-x-2">
          <div className="flex flex-row gap-x-2">
            <SongSubtitlesSelect
              song={song}
              value={alignmentId}
              onValueChange={setAlignmentId}
              disabled={disabled}
            />
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
      <div className="m-8 flex flex-col justify-center">
        {videoUrl &&
          audioUrl &&
          alignment &&
          subtitlesPreset &&
          styleOptionsMapping && (
            <SyncTool
              song={song}
              videoUrl={videoUrl}
              subtitlesPreset={subtitlesPreset}
              styleOptionsMapping={styleOptionsMapping}
              alignment={alignment}
              onChange={handleChange}
              resolution={resolution}
              peaks={peaks}
              audioUrl={audioUrl}
              theme={(resolvedTheme as Theme) || "light"}
            />
          )}
      </div>
    </>
  );
}

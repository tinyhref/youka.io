import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { usePlayerStore } from "@/stores/player";
import { IAlignmentItemLine, Alignment2Line } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import SyncLine from "@/components/SyncLine";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { safeFileUrl } from "@/lib/library";
import useSong from "@/hooks/song";
import rollbar from "@/lib/rollbar";
import { SongStemSelect } from "@/components/SongStemSelect";
import { SongStemModelSelect } from "@/components/SongStemModelSelect";
import { IconTooltip } from "@/components/IconTooltip";
import { Label } from "@/components/ui/label";
import { formatSongTitle } from "@/lib/utils";

export default function SyncLinePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  let { songId } = useParams();
  const [updateAlignment] = usePlayerStore((state) => [state.updateAlignment]);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
  const [stemId, setStemId] = useState<string>("");
  const [stemModelId, setStemModelId] = useState<string>("original");
  const [alignments, setAlignments] = useState<IAlignmentItemLine[]>();
  const song = useSong(songId);

  useEffect(() => {
    if (!song) return;
    const stems = song.stems.filter((s) => s.modelId === stemModelId);
    let stem = stems.find((s) => s.type === "original");
    if (!stem) {
      stem = stems[0];
    }
    if (stem) {
      setStemId(stem.id);
    }
  }, [song, stemModelId]);

  useEffect(() => {
    if (!song || !stemId) return;
    const stem = song.stems.find((s) => s.id === stemId);
    if (stem) {
      setAudioUrl(safeFileUrl(stem.filepath));
    } else {
      rollbar.warning("sync-line: stem not found", { song, stemId });
    }
  }, [song, stemId]);

  function handleCancel() {
    navigate(-1);
  }

  async function handleSave() {
    if (!song || !alignments) return null;

    try {
      const alignment: Alignment2Line = {
        id: uuidv4(),
        modelId: "line",
        mode: "line",
        alignment: alignments,
        createdAt: new Date().toISOString(),
      };
      await updateAlignment(song.id, alignment, false);
      toast({
        title: "Sync saved successfully",
        description: song.title,
        image: song.image,
      });
      navigate(`/player?sid=${song.id}&aid=${alignment.id}`);
    } catch (err) {
      toast({
        title: "Sync save failed",
        description: song.title,
        image: song.image,
      });
    }
  }

  if (!song) return null;

  const instructions: string[] = t("sync.line.instructions", {
    returnObjects: true,
  });

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
            label: t("Manual Line Sync"),
            url: `/sync-line/${song.id}`,
          },
        ]}
      >
        <div className="flex flex-row items-center gap-2">
          <IconTooltip>
            {instructions.map((instruction: string, index: number) => (
              <div key={index}>
                {index + 1}. {instruction}
              </div>
            ))}
          </IconTooltip>
          <Label>{t("How to use")}</Label>
        </div>
        <Button variant="outline" onClick={handleCancel}>
          {t("Cancel")}
        </Button>
        <Button variant="default" onClick={handleSave} disabled={!alignments}>
          {t("Save")}
        </Button>
      </Header>
      <div className="h-[60vh] m-8 flex flex-col items-center">
        <div className="flex flex-row gap-2">
          <SongStemModelSelect
            withLabel
            song={song}
            value={stemModelId}
            onValueChange={setStemModelId}
          />
          <SongStemSelect
            withLabel
            song={song}
            modelId={stemModelId}
            value={stemId}
            onValueChange={setStemId}
          />
        </div>
        {audioUrl ? (
          <SyncLine
            lyrics={song.lyrics || ""}
            audioUrl={audioUrl}
            onChange={(a) => setAlignments(a)}
          />
        ) : (
          <div className="self-center">Can't find original audio</div>
        )}
      </div>
    </>
  );
}

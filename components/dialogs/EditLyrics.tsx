import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { ISongProcessed, SongMetadata } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePlayerStore } from "@/stores/player";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { LyricsLangSelect } from "@/components/LyricsLangSelect";
import PasteButton from "../PasteButton";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlignModelSelect } from "../AlignModelSelect";

interface Props {
  song: ISongProcessed;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditLyrics = ({ open, onOpenChange, song }: Props) => {
  const { t } = useTranslation();
  const [lyrics, setLyricsLocal] = useState("");
  const [lang, setLang] = useState("");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [role, syncLyrics, setTab, setMetadata] = usePlayerStore((state) => [
    state.role,
    state.syncLyrics,
    state.setTab,
    state.setMetadata,
  ]);
  const [alignModel, setAlignModel] = useState("auto");
  const isTranscriptionModel =
    alignModel === "whisper" || alignModel === "audioshake-transcription";
  const disabled = role === "none";

  useEffect(() => {
    setLyricsLocal(song.lyrics || "");
    setLang(song.lang || "");
  }, [song, open]);

  async function handleSave() {
    try {
      setLoading(true);

      const metadata: SongMetadata = {
        id: song.id,
        image: song.image,
        lang: lang,
        title: song.title,
        lyrics: lyrics.trim(),
      };
      await setMetadata(song.id, metadata);

      await syncLyrics(song, lyrics, lang, alignModel);

      onOpenChange(false);

      setTab("jobs");

      toast({
        title: "Lyrics saved successfully",
        description: song.title,
        image: song.image,
      });
    } catch (err) {
      toast({
        title: "Lyrics save failed",
        description: song.title,
        image: song.image,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Edit Lyrics")}</DialogTitle>
        </DialogHeader>

        <Textarea
          disabled={isTranscriptionModel}
          dir="auto"
          className="text-lg h-[40vh]"
          value={lyrics}
          onChange={(e) => setLyricsLocal(e.target.value)}
        />

        <div className="flex flex-row justify-between">
          <LyricsLangSelect
            withLabel
            withTopValue
            value={lang}
            onChange={setLang}
          />
          <AlignModelSelect
            withLabel
            value={alignModel}
            onChange={setAlignModel}
          />
          <div className="self-end">
            <PasteButton
              disabled={isTranscriptionModel}
              showText
              onPasteEvent={setLyricsLocal}
            />
          </div>
        </div>

        {isTranscriptionModel && (
          <Alert>
            <AlertDescription>
              {t("dialogs.edit_lyrics.transcription")}
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <AlertTitle>
            <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
            {t("heads_up")}
          </AlertTitle>
          <AlertDescription>
            {t("dialogs.edit_lyrics.description")}
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("Cancel")}
          </Button>
          {
            <Button disabled={disabled || loading} onClick={() => handleSave()}>
              {t("Save and Sync")}
              {loading && (
                <FontAwesomeIcon
                  icon={faSpinner}
                  spin={loading}
                  className="ml-2"
                />
              )}
            </Button>
          }
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

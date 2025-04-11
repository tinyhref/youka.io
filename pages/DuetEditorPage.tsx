import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import { usePlayerStore } from "@/stores/player";
import { useNavigate, useParams } from "react-router-dom";
import { Alignment3, ISongProcessed } from "@/types";
import { alignment2ToAlignment3 } from "@/lib/alignment";
import { DuetEditor } from "@/components/DuetEditor";
import { useSettingsStore } from "@/stores/settings";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { getCustomAlignment, safeFileUrl } from "@/lib/library";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatSongTitle } from "@/lib/utils";
import { SongSubtitlesSelect } from "@/components/SongSubtitlesSelect";

export default function DuetEditorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  let { songId } = useParams();
  const [styles] = useSettingsStore((state) => [state.styles]);
  const [
    songs,
    updateAlignment,
    selectedAlignment,
  ] = usePlayerStore((state) => [
    state.songs,
    state.updateAlignment,
    state.selectedAlignment,
  ]);
  const [alignmentId, setAlignmentId] = useState<string>(
    selectedAlignment?.id || ""
  );
  const [alignment3, setAlignment3] = React.useState<Alignment3>();
  const [newAlignment3, setNewAlignment3] = React.useState<Alignment3>();
  const [song, setSong] = React.useState<ISongProcessed>();

  useEffect(() => {
    if (!songId) return;

    const song = songs[songId];
    if (song?.status !== "processed") return;

    setSong(song);

    const alignment2 = song.alignments2?.find((a) => a.id === alignmentId);
    if (!alignment2) {
      return;
    }
    const alignment3 = alignment2ToAlignment3(alignment2);

    setAlignment3(structuredClone(alignment3));
  }, [songId, alignmentId, songs]);

  async function handleSave() {
    if (newAlignment3 && songId) {
      try {
        setSaving(true);
        const customAlignment = getCustomAlignment(newAlignment3, "custom");
        await updateAlignment(songId, customAlignment, false);
        navigate(`/player?sid=${songId}&aid=${customAlignment.id}`);
      } catch (error) {
        console.error(error);
      } finally {
        setSaving(false);
      }
    }
  }

  function handleCancel() {
    navigate(-1);
  }

  function onChange(alignment3: Alignment3) {
    setNewAlignment3(alignment3);
  }

  if (!song || !alignment3) return <Header showNav />;

  const stylesNames = styles.map((style) => style.name);
  let filepath = song.stems.find((s) => s.type === "original")?.filepath;
  if (!filepath && song.stems.length > 0) {
    filepath = song.stems[0].filepath;
  }

  const audioUrl = filepath ? safeFileUrl(filepath) : undefined;

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
            label: t("Duet Editor"),
            url: `/duet-editor/${song.id}`,
          },
        ]}
      >
        <div className="flex flex-row gap-x-2">
          <SongSubtitlesSelect
            song={song}
            value={alignmentId}
            onValueChange={setAlignmentId}
          />
          <Button variant="outline" onClick={handleCancel}>
            {t("Cancel")}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {t("Save")}
            {saving && (
              <FontAwesomeIcon className="ml-2" icon={faSpinner} spin />
            )}
          </Button>
        </div>
      </Header>
      <div className="flex flex-col justify-center my-5 mx-10">
        <DuetEditor
          audioUrl={audioUrl}
          alignment={alignment3}
          styles={stylesNames}
          onChange={onChange}
        />
      </div>
    </>
  );
}

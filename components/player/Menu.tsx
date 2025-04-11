import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrashCan,
  faClosedCaptioning,
  faFileAudio,
  faFileVideo,
  faFileCode,
  faImage,
  faFileLines,
} from "@fortawesome/free-regular-svg-icons";
import { Delete } from "@/components/dialogs/Delete";
import { EditMetadata } from "@/components/dialogs/EditMetadata";
import { EditLyrics } from "@/components/dialogs/EditLyrics";
import {
  AspectRatio,
  FileType,
  InputExportMedia,
  Role,
  SingerToStyleOptionsMapping,
  SubtitlesPreset,
} from "@/types";
import { usePlayerStore } from "@/stores/player";
import { useNavigate } from "react-router-dom";
import { faDownload } from "@/icons";
import { useSettingsStore } from "@/stores/settings";
import { UpgradeLabel } from "../UpgradeLabel";
import { EditBackground } from "@/components/dialogs/EditBackground";
import {
  faFileImport,
  faFont,
  faScissors,
  faStarHalfStroke,
  faTv,
} from "@fortawesome/free-solid-svg-icons";
import {
  Alignment2Label,
  SplitModelId2Label,
  Stem2Label,
} from "@/components/Labels";
import { useToast } from "../ui/use-toast";
import { ImportSubtitles } from "../dialogs/ImportSubtitles";
import { isActiveRole, isOKRole, videoTitle } from "@/lib/utils";
import { ImportStem } from "../dialogs/ImportStem";
import { Badge } from "../ui/badge";
import { AddKaraokeIntro } from "../dialogs/AddKaraokeIntro";
import useSong from "@/hooks/song";

const iconClassName = "mr-2 h-4 w-4";

interface MenubarItem2Props {
  label: string;
  icon: any;
  onClick: () => void;
  disabled?: boolean;
  upgrade?: boolean;
  feature?: string;
  role?: Role;
  badge?: string;
}

function MenubarItem2({
  label,
  icon,
  onClick,
  disabled,
  upgrade,
  feature,
  role,
  badge,
}: MenubarItem2Props) {
  const [setUpgradeOpen] = usePlayerStore((state) => [state.setUpgradeOpen]);

  return (
    <MenubarItem
      disabled={disabled}
      onClick={
        upgrade
          ? () => {
              feature && role && setUpgradeOpen(feature, role);
            }
          : onClick
      }
    >
      <FontAwesomeIcon icon={icon} className={iconClassName} />
      <div className="flex flex-row w-full justify-between">
        <div>{label}</div>
        {upgrade && feature && role && (
          <div className="ml-2">
            <UpgradeLabel feature={feature} role={role} />
          </div>
        )}
        {badge && <Badge className="ml-2">{badge}</Badge>}
      </div>
    </MenubarItem>
  );
}

export const Menu = () => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const [
    songId,
    pitch,
    tempo,
    vocalsVolume,
    noVocalsVolume,
    exportMedia,
    selectedAlignment,
    setSelectedAlignment,
    selectedVocals,
    selectedInstruments,
    selectedVideo,
    setSelectedVocals,
    setSelectedInstruments,
    setSelectedVideo,
    split,
    deleteSong,
    resizeVideo,
    refreshSubtitles,
    deleteVideo,
    deleteStem,
    deleteAlignment,
  ] = usePlayerStore((state) => [
    state.songId,
    state.pitch,
    state.tempo,
    state.vocalsVolume,
    state.noVocalsVolume,
    state.exportMedia,
    state.selectedAlignment,
    state.setSelectedAlignment,
    state.selectedVocals,
    state.selectedInstruments,
    state.selectedVideo,
    state.setSelectedVocals,
    state.setSelectedInstruments,
    state.setSelectedVideo,
    state.split,
    state.deleteSong,
    state.resizeVideo,
    state.refreshSubtitles,
    state.deleteVideo,
    state.deleteStem,
    state.deleteAlignment,
  ]);
  const [
    role,
    getSubtitlesPreset,
    setSubtitlesPreset,
    getStyleOptionsMapping,
    getStyleMapping,
    setStyleMapping,
  ] = usePlayerStore((state) => [
    state.role,
    state.getSubtitlesPreset,
    state.setSubtitlesPreset,
    state.getStyleOptionsMapping,
    state.getStyleMapping,
    state.setStyleMapping,
  ]);
  const [
    ffmpegOptions,
    subtitlesPresets,
    styleMappings,
  ] = useSettingsStore((state) => [
    state.ffmpegOptions,
    state.subtitlesPresets,
    state.styleMappings,
  ]);
  const song = useSong(songId);
  const navigate = useNavigate();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editLyricsOpen, setEditLyricsOpen] = useState(false);
  const [editMetadataOpen, setEditMetadataOpen] = useState(false);
  const [editBackgroundOpen, setEditBackgroundOpen] = useState(false);
  const [importSubtitlesOpen, setImportSubtitlesOpen] = useState(false);
  const [importStemOpen, setImportStemOpen] = useState(false);
  const [disableSplit, setDisableSplit] = useState(false);
  const [hasVocals, setHasVocals] = useState(false);
  const [hasOriginal, setHasOriginal] = useState(false);
  const [addKaraokeIntroOpen, setAddKaraokeIntroOpen] = useState(false);
  const [subtitlesPresetLocal, setSubtitlesPresetLocal] = useState<
    SubtitlesPreset
  >();
  const [styleOptionsMapping, setStyleOptionsMapping] = useState<
    SingerToStyleOptionsMapping
  >();

  const isProd = process.env.NODE_ENV === "production";

  useEffect(() => {
    if (!song) return;
    setStyleOptionsMapping(getStyleOptionsMapping(song.id));
    setSubtitlesPresetLocal(getSubtitlesPreset(song.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song]);

  useEffect(() => {
    if (song && song.status === "processed") {
      setHasVocals(song.stems.some((s) => s.type === "vocals"));
      setHasOriginal(song.stems.some((s) => s.type === "original"));
    }
    return () => {
      setDisableSplit(false);
    };
  }, [song]);

  const manualSyncDisabled =
    song?.status !== "processed" || !song.lyrics || !hasOriginal;
  const wordSyncDisabled =
    song?.status !== "processed" ||
    !selectedAlignment ||
    selectedAlignment.modelId === "line";

  const syncDisabled = !isOKRole(
    [
      "trial",
      "basic",
      "standard",
      "pro",
      "payperuse",
      "credits",
      "trial-expired",
    ],
    role
  );
  const editLyricsDisabled = !isActiveRole(role);
  const generateDisabled = !isActiveRole(role);

  const hasDemucs = useMemo(() => {
    return (
      song?.status === "processed" &&
      song.stems.some((s) => s.modelId === "demucs")
    );
  }, [song]);
  const hasMDXNetKara2 = useMemo(() => {
    return (
      song?.status === "processed" &&
      song.stems.some((s) => s.modelId === "uvr_mdxnet_kara_2")
    );
  }, [song]);
  const hasMDX23C = useMemo(() => {
    return (
      song?.status === "processed" &&
      song.stems.some((s) => s.modelId === "mdx23c")
    );
  }, [song]);
  const hasMelBandRoformerInstrumentalBecruily = useMemo(() => {
    return (
      song?.status === "processed" &&
      song.stems.some(
        (s) => s.modelId === "mel_band_roformer_instrumental_becruily"
      )
    );
  }, [song]);
  const hasMelBandRoformerInstrumentalInstv7Gabox = useMemo(() => {
    return (
      song?.status === "processed" &&
      song.stems.some(
        (s) => s.modelId === "mel_band_roformer_instrumental_instv7_gabox"
      )
    );
  }, [song]);

  function handleSelectVocalsStem(stemId: string) {
    if (!song || song.status !== "processed") return;
    const stem = song.stems.find((s) => s.id === stemId);
    if (!stem) return;
    setSelectedVocals(song.id, stem);
  }

  function handleSelectNoVocalsStem(stemId: string) {
    if (!song || song.status !== "processed") return;
    const stem = song.stems.find((s) => s.id === stemId);
    if (!stem) return;
    setSelectedInstruments(song.id, stem);
  }

  function handleSelectVideo(videoId: string) {
    if (!song || song.status !== "processed") return;
    const video = song.videos.find((v) => v.id === videoId);
    if (!video) return;
    setSelectedVideo(song.id, video);
  }

  async function handleSplit(modelId: string) {
    if (!song || song.status !== "processed") return;
    try {
      setDisableSplit(true);
      await split(song, modelId);
      toast({
        title: "Split job is running",
        description: song.title,
        image: song.image,
      });
    } catch (e) {
      console.error(e);
      setDisableSplit(false);
      toast({
        title: "Failed to run the split job",
        description: song.title,
        image: song.image,
      });
    }
  }

  function handleChangeAspectRatio(aspectRatio: AspectRatio) {
    if (song?.status !== "processed") return;
    if (!selectedVideo) return;
    resizeVideo({
      song,
      videoId: selectedVideo.id,
      aspectRatio,
      ffmpegOptions,
    });
  }

  function exportMediaInternal(fileType: FileType) {
    if (
      song?.status !== "processed" ||
      !styleOptionsMapping ||
      !subtitlesPresetLocal
    )
      return;

    if (!selectedInstruments || !selectedVideo) {
      throw new Error("Stems not selected");
    }

    const input: InputExportMedia = {
      song,
      preset: subtitlesPresetLocal,
      fileType,
      pitch,
      tempo,
      vocalsVolume,
      instrumentsStem: selectedInstruments,
      vocalsStem: selectedVocals,
      instrumentsVolume: noVocalsVolume,
      alignment: selectedAlignment,
      video: selectedVideo,
      styleOptionsMapping,
      ffmpegOptions,
    };
    exportMedia(input);
  }

  if (song?.status !== "processed") {
    return null;
  }

  return (
    <div className="flex flex-row gap-2">
      <Delete
        title={song.title}
        image={song.image}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        successMessage="Karaoke removed successfully"
        errorMessage="Karaoke removal failed"
        fn={() => deleteSong(song)}
      />
      <EditMetadata
        song={song}
        open={editMetadataOpen}
        onOpenChange={setEditMetadataOpen}
      />
      <EditLyrics
        song={song}
        open={editLyricsOpen}
        onOpenChange={setEditLyricsOpen}
      />
      {selectedInstruments && (
        <EditBackground
          song={song}
          selectedInstruments={selectedInstruments}
          open={editBackgroundOpen}
          onOpenChange={setEditBackgroundOpen}
        />
      )}
      <ImportSubtitles
        song={song}
        open={importSubtitlesOpen}
        onOpenChange={setImportSubtitlesOpen}
      />
      <ImportStem
        song={song}
        open={importStemOpen}
        onOpenChange={setImportStemOpen}
      />
      {selectedVideo && selectedVocals && (
        <AddKaraokeIntro
          song={song}
          videoId={selectedVideo.id}
          stemId={selectedVocals.id}
          alignmentId={selectedAlignment?.id}
          open={addKaraokeIntroOpen}
          onOpenChange={setAddKaraokeIntroOpen}
        />
      )}

      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>
            <FontAwesomeIcon icon={faEdit} className={iconClassName} />
            {t("Edit")}
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem2
              upgrade={editLyricsDisabled}
              role="standard"
              feature={t("Edit Lyrics")}
              disabled={!song || !hasOriginal}
              onClick={() => setEditLyricsOpen(true)}
              icon={faFont}
              label={t("Edit Lyrics")}
            />
            <MenubarItem2
              disabled={!song}
              onClick={() => setEditMetadataOpen(true)}
              icon={faEdit}
              label={t("Edit Metadata")}
            />

            <MenubarItem2
              disabled={!song}
              onClick={() => navigate(`/trim/${songId}`)}
              icon={faScissors}
              label={t("dialogs.trim.title")}
            />

            <MenubarItem2
              disabled={!song || !selectedVideo || !selectedVocals}
              onClick={() => setAddKaraokeIntroOpen(true)}
              icon={faStarHalfStroke}
              label={t("Add Intro Video")}
            />

            <MenubarSeparator />

            <MenubarItem2
              upgrade={syncDisabled}
              role="standard"
              feature={t("Manual Sync")}
              disabled={wordSyncDisabled}
              onClick={() => navigate(`/manual-sync/${songId}`)}
              icon={faClosedCaptioning}
              label={t("Manual Sync")}
            />

            <MenubarItem2
              upgrade={syncDisabled}
              role="standard"
              feature={t("Manual Sync")}
              disabled={wordSyncDisabled}
              onClick={() => navigate(`/sync-word/${songId}`)}
              icon={faClosedCaptioning}
              label={`${t("Manual Sync")} (${t("Legacy")})`}
            />

            <MenubarItem2
              upgrade={syncDisabled}
              role="standard"
              feature={t("Manual Line Sync")}
              disabled={manualSyncDisabled}
              onClick={() => navigate(`/sync-line/${songId}`)}
              icon={faClosedCaptioning}
              label={t("Manual Line Sync")}
            />

            <MenubarItem2
              upgrade={syncDisabled}
              role="standard"
              feature={t("Duet Editor")}
              disabled={wordSyncDisabled}
              onClick={() =>
                navigate(`/duet-editor/${songId}/${selectedAlignment?.id}`)
              }
              icon={faFileLines}
              label={t("Duet Editor")}
            />

            <MenubarSeparator />

            <MenubarItem2
              disabled={!song}
              onClick={() => setDeleteOpen(true)}
              icon={faTrashCan}
              label={t("Delete")}
            />
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>
            <FontAwesomeIcon icon={faFileVideo} className={iconClassName} />
            {t("Video")}
          </MenubarTrigger>
          <MenubarContent className="max-h-[400px] overflow-auto">
            <MenubarLabel>{t("Video")}</MenubarLabel>
            <MenubarRadioGroup
              value={selectedVideo?.id}
              onValueChange={handleSelectVideo}
            >
              {song.videos.map((video) => (
                <MenubarRadioItem
                  key={video.id}
                  value={video.id}
                  className="flex flex-row justify-between group gap-2"
                >
                  {videoTitle(video)}
                  {!isProd && (
                    <FontAwesomeIcon
                      className="z-10 cursor-pointer hidden group-hover:block"
                      icon={faTrashCan}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteVideo(song.id, video.id, video.groupId);
                      }}
                    />
                  )}
                </MenubarRadioItem>
              ))}
            </MenubarRadioGroup>

            <MenubarSeparator />

            <MenubarLabel>{t("Edit")}</MenubarLabel>

            <MenubarItem2
              disabled={!song || !selectedInstruments}
              onClick={() => setEditBackgroundOpen(true)}
              icon={faImage}
              label={t("Change Background")}
            />

            {selectedVideo && (
              <MenubarSub>
                <MenubarSubTrigger disabled={!song || !selectedVideo}>
                  <FontAwesomeIcon icon={faTv} className={iconClassName} />
                  {t("Change Aspect Ratio")}
                </MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem2
                    onClick={() =>
                      handleChangeAspectRatio({ width: 16, height: 9 })
                    }
                    icon={faTv}
                    label={t("Horizontal") + " - 16:9"}
                  />
                  <MenubarItem2
                    onClick={() =>
                      handleChangeAspectRatio({ width: 9, height: 16 })
                    }
                    icon={faTv}
                    label={t("Vertical") + " - 9:16"}
                  />
                  <MenubarItem2
                    onClick={() =>
                      handleChangeAspectRatio({ width: 4, height: 5 })
                    }
                    icon={faTv}
                    label={t("Vertical") + " - 4:5"}
                  />
                  <MenubarItem2
                    onClick={() =>
                      handleChangeAspectRatio({ width: 2, height: 3 })
                    }
                    icon={faTv}
                    label={t("Vertical") + " - 2:3"}
                  />
                  <MenubarItem2
                    onClick={() =>
                      handleChangeAspectRatio({ width: 1, height: 1 })
                    }
                    icon={faTv}
                    label={t("Square") + " - 1:1"}
                  />
                </MenubarSubContent>
              </MenubarSub>
            )}
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>
            <FontAwesomeIcon icon={faFileAudio} className={iconClassName} />
            {t("Audio")}
          </MenubarTrigger>
          <MenubarContent className="max-h-[400px] overflow-auto">
            <MenubarLabel>{t("Instrumental")}</MenubarLabel>
            <MenubarRadioGroup
              value={selectedInstruments?.id}
              onValueChange={handleSelectNoVocalsStem}
            >
              {song.stems
                .filter((s) => s.type === "instruments")
                .map((stem) => (
                  <MenubarRadioItem
                    key={stem.id}
                    value={stem.id}
                    className="flex flex-row justify-between group gap-2"
                  >
                    <Stem2Label stem={stem} />
                    {!isProd && (
                      <FontAwesomeIcon
                        className="z-10 cursor-pointer hidden group-hover:block"
                        icon={faTrashCan}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteStem(song.id, stem.id, stem.groupId);
                        }}
                      />
                    )}
                  </MenubarRadioItem>
                ))}
            </MenubarRadioGroup>

            <MenubarSeparator />

            {hasVocals && (
              <>
                <MenubarLabel>{t("Vocals")}</MenubarLabel>
                <MenubarRadioGroup
                  value={selectedVocals?.id}
                  onValueChange={handleSelectVocalsStem}
                >
                  {song.stems
                    .filter((s) => s.type === "vocals")
                    .map((stem) => (
                      <MenubarRadioItem
                        key={stem.id}
                        value={stem.id}
                        className="flex flex-row justify-between group gap-2"
                      >
                        <Stem2Label stem={stem} />
                        {!isProd && (
                          <FontAwesomeIcon
                            className="z-10 cursor-pointer hidden group-hover:block"
                            icon={faTrashCan}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteStem(song.id, stem.id, stem.groupId);
                            }}
                          />
                        )}
                      </MenubarRadioItem>
                    ))}
                </MenubarRadioGroup>
              </>
            )}

            {hasOriginal && (
              <>
                {(!hasDemucs ||
                  !hasMDXNetKara2 ||
                  !hasMDX23C ||
                  !hasMelBandRoformerInstrumentalBecruily ||
                  !hasMelBandRoformerInstrumentalInstv7Gabox) && (
                  <>
                    <MenubarSeparator />
                    <MenubarLabel>{t("Create")}</MenubarLabel>
                  </>
                )}

                {!hasMDXNetKara2 && (
                  <MenubarItem
                    onClick={() => handleSplit("uvr_mdxnet_kara_2")}
                    disabled={disableSplit || generateDisabled || !hasOriginal}
                  >
                    <FontAwesomeIcon
                      icon={faFileAudio}
                      className={iconClassName}
                    />
                    <SplitModelId2Label modelId="uvr_mdxnet_kara_2" />
                  </MenubarItem>
                )}

                {!hasMDX23C && (
                  <MenubarItem
                    onClick={() => handleSplit("mdx23c")}
                    disabled={disableSplit || generateDisabled || !hasOriginal}
                  >
                    <FontAwesomeIcon
                      icon={faFileAudio}
                      className={iconClassName}
                    />
                    <SplitModelId2Label modelId="mdx23c" />
                  </MenubarItem>
                )}
                {!hasMelBandRoformerInstrumentalBecruily && (
                  <MenubarItem
                    onClick={() =>
                      handleSplit("mel_band_roformer_instrumental_becruily")
                    }
                    disabled={disableSplit || generateDisabled || !hasOriginal}
                  >
                    <FontAwesomeIcon
                      icon={faFileAudio}
                      className={iconClassName}
                    />
                    <SplitModelId2Label modelId="mel_band_roformer_instrumental_becruily" />
                  </MenubarItem>
                )}
                {!hasMelBandRoformerInstrumentalInstv7Gabox && (
                  <MenubarItem
                    onClick={() =>
                      handleSplit("mel_band_roformer_instrumental_instv7_gabox")
                    }
                    disabled={disableSplit || generateDisabled || !hasOriginal}
                  >
                    <FontAwesomeIcon
                      icon={faFileAudio}
                      className={iconClassName}
                    />
                    <SplitModelId2Label modelId="mel_band_roformer_instrumental_instv7_gabox" />
                  </MenubarItem>
                )}
                {!hasDemucs && (
                  <MenubarItem
                    onClick={() => handleSplit("demucs")}
                    disabled={disableSplit || generateDisabled || !hasOriginal}
                  >
                    <FontAwesomeIcon
                      icon={faFileAudio}
                      className={iconClassName}
                    />
                    <SplitModelId2Label modelId="demucs" />
                  </MenubarItem>
                )}
              </>
            )}

            <MenubarSeparator />
            <MenubarItem2
              disabled={!song}
              onClick={() => setImportStemOpen(true)}
              icon={faFileImport}
              label={t("Import Stem")}
            />
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>
            <FontAwesomeIcon
              icon={faClosedCaptioning}
              className={iconClassName}
            />
            {t("Subtitles")}
          </MenubarTrigger>
          <MenubarContent className="max-h-[400px] overflow-auto">
            <MenubarSub>
              <MenubarSubTrigger>{t("Sync Model")}</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarRadioGroup
                  value={selectedAlignment?.id || ""}
                  onValueChange={(value) => setSelectedAlignment(value, true)}
                >
                  {song.alignments2?.map((alignment) => (
                    <MenubarRadioItem
                      value={alignment.id}
                      key={alignment.id}
                      className="flex flex-row justify-between group gap-2"
                    >
                      <Alignment2Label alignment={alignment} />
                      {!isProd && (
                        <FontAwesomeIcon
                          className="z-10 cursor-pointer hidden group-hover:block"
                          icon={faTrashCan}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAlignment(
                              song.id,
                              alignment.id,
                              alignment.groupId
                            );
                          }}
                        />
                      )}
                    </MenubarRadioItem>
                  ))}

                  <MenubarRadioItem value="" key="off">
                    {t("Off")}
                  </MenubarRadioItem>
                </MenubarRadioGroup>
              </MenubarSubContent>
            </MenubarSub>

            <MenubarSub>
              <MenubarSubTrigger>{t("Preset")}</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarRadioGroup
                  value={subtitlesPresetLocal?.id || ""}
                  onValueChange={async (value) => {
                    setSubtitlesPresetLocal(
                      subtitlesPresets.find((p) => p.id === value)
                    );
                    await setSubtitlesPreset(song.id, value);
                    refreshSubtitles();
                  }}
                >
                  {subtitlesPresets.map((preset) => (
                    <MenubarRadioItem value={preset.id} key={preset.id}>
                      {preset.name}
                    </MenubarRadioItem>
                  ))}
                </MenubarRadioGroup>
              </MenubarSubContent>
            </MenubarSub>

            <MenubarSub>
              <MenubarSubTrigger>{t("Style Mapping")}</MenubarSubTrigger>

              <MenubarSubContent>
                <MenubarRadioGroup
                  value={getStyleMapping(song.id).id}
                  onValueChange={async (value) => {
                    await setStyleMapping(song.id, value);
                    refreshSubtitles();
                  }}
                >
                  {styleMappings.map((mapping) => (
                    <MenubarRadioItem value={mapping.id} key={mapping.id}>
                      {mapping.name}
                    </MenubarRadioItem>
                  ))}
                </MenubarRadioGroup>
              </MenubarSubContent>
            </MenubarSub>

            <MenubarSeparator />

            <MenubarItem2
              disabled={!song}
              onClick={() => setImportSubtitlesOpen(true)}
              icon={faFileImport}
              label={t("Import Subtitles")}
            />
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>
            <FontAwesomeIcon icon={faDownload} className={iconClassName} />
            {t("Download")}
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem2
              onClick={() => exportMediaInternal(FileType.MP4)}
              icon={faFileVideo}
              label={t("Video") + " [.mp4]"}
            />
            <MenubarItem2
              onClick={() => exportMediaInternal(FileType.MKV)}
              icon={faFileVideo}
              label={t("Video") + " [.mkv]"}
            />
            <MenubarItem2
              onClick={() => exportMediaInternal(FileType.Inandon)}
              icon={faFileVideo}
              label="InAndOn [.mp4]"
            />
            <MenubarSeparator />

            <MenubarItem2
              onClick={() => exportMediaInternal(FileType.MP3)}
              icon={faFileAudio}
              label={t("Audio") + " [.mp3]"}
            />
            <MenubarItem2
              onClick={() => exportMediaInternal(FileType.WAV)}
              icon={faFileAudio}
              label={t("Audio") + " [.wav]"}
            />

            <MenubarSeparator />

            <MenubarItem2
              onClick={() => exportMediaInternal(FileType.ASS)}
              icon={faFileCode}
              label={t("Subtitles") + " [.ass]"}
            />
            <MenubarItem2
              onClick={() => exportMediaInternal(FileType.LRC)}
              icon={faFileCode}
              label={t("Subtitles") + " [.lrc]"}
            />
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  );
};

import React, { useEffect, useMemo, useState } from "react";
import { faClosedCaptioning } from "@fortawesome/free-regular-svg-icons";
import { useTranslation } from "react-i18next";
import { SettingsItemsContainer } from "../SettingsItemsContainer";
import { SettingSubtitlesPreset } from "./SettingSubtitlesPreset";
import { SubtitlesPreset, StyleMapping } from "@/types";
import {
  DefaultStyleMapping,
  DefaultSubtitlesPreset2,
  DefaultSubtitlesPreset3,
  DefaultSubtitlesPreset4,
} from "@/consts";
import { useSettingsStore } from "@/stores/settings";
import InputSubtitlesPreset from "@/components/InputSubtitlesPreset";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { randomUUID } from "crypto";
import { faCheck, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { ActionButton } from "@/components/ActionButton";
import InputStyleMapping from "@/components/InputStyleMapping";
import { getStyleMappingOptionsFromStyleMapping } from "@/lib/utils";

export const icon = faClosedCaptioning;

export const Title = () => {
  const { t } = useTranslation();
  return t("Subtitles Preset");
};
export const key = "subtitles";

export function Comp() {
  const { t } = useTranslation();
  const [item, setItem] = React.useState("");

  const [styleMapping, setStyleMapping] = useState<StyleMapping>(
    DefaultStyleMapping
  );
  const [
    newSubtitlesPresetDialogOpen,
    setNewSubtitlesPresetDialogOpen,
  ] = useState(false);
  const setSubtitlesPreset = useSettingsStore(
    (state) => state.setSubtitlesPreset
  );
  const styles = useSettingsStore((state) => state.styles);
  const deleteSubtitlesPreset = useSettingsStore(
    (state) => state.deleteSubtitlesPreset
  );
  const setDefaultSubtitlePresetId = useSettingsStore(
    (state) => state.setDefaultSubtitlePresetId
  );
  const [subtitlesPresetIndex, setSubtitlesPresetIndex] = useState(0);
  const subtitlesPresets = useSettingsStore((state) => state.subtitlesPresets);

  const localSubtitlesPreset = useMemo(() => {
    return subtitlesPresets[subtitlesPresetIndex];
  }, [subtitlesPresetIndex, subtitlesPresets]);

  const styleMappings = useSettingsStore((state) => state.styleMappings);
  const runtime = useMemo(
    () => ({
      styleOptionsMapping: getStyleMappingOptionsFromStyleMapping(
        styleMapping,
        styles
      ),
      rtl: false,
      title: "Song Title",
      artists: ["Some Artist"],
      lang: "en",
      resolution: localSubtitlesPreset.baseResolution,
    }),
    [styleMapping, styles, localSubtitlesPreset.baseResolution]
  );

  function handleSubtitlesPreset(subtitlesPreset: SubtitlesPreset) {
    setSubtitlesPreset(subtitlesPreset);
    setSubtitlesPresetIndex(subtitlesPresets.length);
  }

  function handleSetLocalSubtitlesPreset(subtitlesPreset: SubtitlesPreset) {
    setSubtitlesPresetIndex(
      subtitlesPresets.findIndex((p) => p.id === subtitlesPreset.id)
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row items-end gap-2 sticky top-0 bg-background pb-4 w-full border-b border-border z-10">
        <InputSubtitlesPreset
          withLabel
          value={localSubtitlesPreset}
          onChange={handleSetLocalSubtitlesPreset}
          subtitlesPresets={subtitlesPresets}
        />
        <InputStyleMapping
          withLabel
          value={styleMapping}
          onChange={setStyleMapping}
          styleMappings={styleMappings}
        />
        <ActionButton
          variant="outline"
          onClick={() => setNewSubtitlesPresetDialogOpen(true)}
          actionText={t("New")}
          actionIcon={faPlus}
        />
        <ActionButton
          variant="outline"
          onClick={() => {
            deleteSubtitlesPreset(localSubtitlesPreset.id);
            setSubtitlesPresetIndex(0);
          }}
          disabled={[
            DefaultSubtitlesPreset2.id,
            DefaultSubtitlesPreset3.id,
            DefaultSubtitlesPreset4.id,
          ].includes(localSubtitlesPreset.id)}
          actionText={t("Delete")}
          actionIcon={faTrash}
        />
        <ActionButton
          variant="outline"
          onClick={() => setDefaultSubtitlePresetId(localSubtitlesPreset.id)}
          actionText={t("Set as Default")}
          actionIcon={faCheck}
        />
        <NewSubtitlesPresetDialog
          open={newSubtitlesPresetDialogOpen}
          onOpenChange={setNewSubtitlesPresetDialogOpen}
          onSubtitlesPreset={handleSubtitlesPreset}
        />
      </div>
      <SettingsItemsContainer value={item} onValueChange={setItem}>
        <SettingSubtitlesPreset
          value={subtitlesPresets[subtitlesPresetIndex]}
          onChange={setSubtitlesPreset}
          runtime={runtime}
        />
      </SettingsItemsContainer>
    </div>
  );
}

interface NewSubtitlesPresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubtitlesPreset(subtitlesPreset: SubtitlesPreset): void;
}

export function NewSubtitlesPresetDialog({
  open,
  onOpenChange,
  onSubtitlesPreset,
}: NewSubtitlesPresetDialogProps) {
  const subtitlesPresets = useSettingsStore((state) => state.subtitlesPresets);
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const [subtitlesPreset, setSubtitlesPreset] = useState<SubtitlesPreset>(
    DefaultSubtitlesPreset3
  );

  useEffect(() => {
    setValue("");
  }, [open]);

  function handleCreate() {
    const name = value.trim();
    if (!name) return;

    onSubtitlesPreset({
      ...subtitlesPreset,
      name,
      id: randomUUID(),
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("New Subtitles Preset")}</DialogTitle>
        </DialogHeader>
        <InputSubtitlesPreset
          value={subtitlesPreset}
          onChange={setSubtitlesPreset}
          subtitlesPresets={subtitlesPresets}
        />
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("Cancel")}
          </Button>
          <Button disabled={!value.trim()} onClick={handleCreate}>
            {t("Create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

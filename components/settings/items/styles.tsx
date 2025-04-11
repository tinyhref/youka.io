import React, { useEffect, useState } from "react";
import { IStyleOptions, SubtitlesPreset } from "@/types";
import { StyleEditor } from "@/components/StyleEditor";
import { useSettingsStore } from "@/stores/settings";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  faInbox,
  faPlus,
  faRotateLeft,
  faSave,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { generateAlignment } from "./subtitles/utils";
import { SettingsPreviewStateless } from "../SettingsPreviewStateless";
import {
  DefaultStyleOptions1,
  DefaultStyles,
  DefaultStylesNames,
} from "@/consts";
import InputSubtitlesPreset from "@/components/InputSubtitlesPreset";
import { StyleSelect } from "@/components/StyleSelect";
import { ActionButton } from "@/components/ActionButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const icon = faInbox;
export const Title = () => {
  const { t } = useTranslation();
  return t("Styles");
};
export const key = "styles";

const alignment = generateAlignment({ numberOfLines: 6 });

export function Comp() {
  const { t } = useTranslation();
  const [
    styles,
    setStyles,
    deleteStyle,
    subtitlesPresets,
    getDefaultSubtitlesPreset,
  ] = useSettingsStore((state) => [
    state.styles,
    state.setStyles,
    state.deleteStyle,
    state.subtitlesPresets,
    state.getDefaultSubtitlesPreset,
  ]);
  const [localStyles, setLocalStyles] = useState<IStyleOptions[]>(styles);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [styleIdx, setStyleIdx] = useState(0);
  const [newStyleName, setNewStyleName] = useState<string | undefined>();
  const [subtitlesPreset, setSubtitlesPreset] = useState<SubtitlesPreset>(
    getDefaultSubtitlesPreset()
  );

  useEffect(() => {
    if (newStyleName) {
      const index = localStyles.findIndex((s) => s.name === newStyleName);
      if (index > -1) {
        setStyleIdx(index);
        setNewStyleName(undefined);
      }
    }
  }, [newStyleName, localStyles]);

  function handleChange(style: IStyleOptions) {
    const styles = [...localStyles];
    styles[styleIdx] = style;
    setLocalStyles(styles);
  }

  function handleSelect(styleIdx: number) {
    setStyleIdx(styleIdx);
  }

  function handleSave() {
    setStyles(localStyles);
  }

  function handleNew() {
    setNewDialogOpen(true);
  }

  function handleDelete(styleName: string) {
    const styles = localStyles.filter((s) => s.name !== styleName);
    setLocalStyles(styles);
    deleteStyle(styleName);
    setStyleIdx(0);
  }

  async function handleCreateStyle(name: string) {
    const style = {
      ...DefaultStyleOptions1,
      name,
    };
    const newStyles = [...localStyles, style];
    setLocalStyles(newStyles);
    setNewStyleName(style.name);
    setStyleIdx(newStyles.length - 1);
    setStyles(newStyles);
  }

  function handleReset(styleName: string) {
    const style = DefaultStyles.find((s) => s.name === styleName);
    if (style) {
      const styles = [...localStyles];
      styles[styleIdx] = style;
      setLocalStyles(styles);
      setStyles(styles);
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-row items-end mb-4 gap-2">
        <NewStyleDialog
          open={newDialogOpen}
          onOpenChange={setNewDialogOpen}
          onStyle={handleCreateStyle}
        />

        <StyleSelect
          value={localStyles[styleIdx].name}
          onChange={(value) =>
            handleSelect(localStyles.findIndex((s) => s.name === value))
          }
          withLabel
        />

        <InputSubtitlesPreset
          withLabel
          subtitlesPresets={subtitlesPresets}
          value={subtitlesPreset}
          onChange={(value) => setSubtitlesPreset(value)}
        />

        <Button variant="outline" onClick={handleNew}>
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          New
        </Button>

        <ActionButton
          disabled={DefaultStylesNames.includes(localStyles[styleIdx].name)}
          variant="outline"
          onClick={() => handleDelete(localStyles[styleIdx].name)}
          actionText={t("Delete")}
          actionIcon={faTrash}
        />

        {DefaultStylesNames.includes(localStyles[styleIdx].name) && (
          <ActionButton
            variant="outline"
            onClick={() => handleReset(localStyles[styleIdx].name)}
            actionText={t("Reset")}
            actionIcon={faRotateLeft}
          />
        )}

        <ActionButton
          onClick={handleSave}
          actionText={t("Save")}
          actionIcon={faSave}
        />
      </div>

      <div className="self-center mb-4">
        <SettingsPreviewStateless
          alignment={alignment}
          styleOptionsMapping={{
            0: localStyles[styleIdx],
          }}
          duration={10}
          resolution={subtitlesPreset.baseResolution}
          subtitlesPreset={subtitlesPreset}
        />
      </div>

      <div className="max-w-[70vw]">
        <StyleEditor
          style={localStyles[styleIdx]}
          onChange={(style) => handleChange(style)}
          withFontName
          withFontSize
          withBold
          withItalic
          withUppercase
          withSpacing
          withOutline
          withShadow
          withPrimaryColor
          withSecondaryColor
          withBackColor
          withOutlineColor
          withShadowColor
          withActiveOutlineColor={
            subtitlesPreset.assRendererSettings.id === "ass3"
          }
          withBlur={subtitlesPreset.assRendererSettings.id === "ass3"}
          withActiveColor={subtitlesPreset.assRendererSettings.id === "ass3"}
          withBorderStyle={subtitlesPreset.assRendererSettings.id === "ass2"}
          withPrimaryColorText={t("Fill Color")}
          withSecondaryColorText={t("Inactive Line Color")}
          withOutlineColorText={t("Inactive Outline Color")}
        />
      </div>
    </div>
  );
}

interface NewStyleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStyle(name: string): void;
}

function NewStyleDialog({ open, onOpenChange, onStyle }: NewStyleDialogProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");

  function handleCreate() {
    const name = value.trim();
    if (name) {
      onStyle(name);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("New Style")}</DialogTitle>
        </DialogHeader>
        <Input value={value} onChange={(e) => setValue(e.target.value)} />
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

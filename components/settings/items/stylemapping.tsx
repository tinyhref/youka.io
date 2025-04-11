import React, { useState } from "react";
import { StyleMapping } from "@/types";
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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faPlus,
  faTrash,
  faWandSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { ActionButton } from "@/components/ActionButton";
import InputStyleMapping from "@/components/InputStyleMapping";
import {
  ALL_SINGERS_ID,
  DefaultStyleMapping,
  DefaultStyleOptions1,
} from "@/consts";
import { randomUUID } from "crypto";
import { StyleSelect } from "@/components/StyleSelect";

export const icon = faWandSparkles;

export const Title = () => {
  const { t } = useTranslation();
  return t("Style Mapping");
};
export const key = "stylemapping";

export function Comp() {
  const { t } = useTranslation();
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [localStyleMapping, setLocalStyleMapping] = useState<StyleMapping>(
    DefaultStyleMapping
  );
  const styleMappings = useSettingsStore((state) => state.styleMappings);
  const setStyleMapping = useSettingsStore((state) => state.setStyleMapping);
  const deleteStyleMapping = useSettingsStore(
    (state) => state.deleteStyleMapping
  );
  const setDefaultStyleMappingId = useSettingsStore(
    (state) => state.setDefaultStyleMappingId
  );

  function handleChange(singer: number, styleName: string) {
    const newStyleMapping: StyleMapping = structuredClone(localStyleMapping);
    newStyleMapping.mapping[singer] = styleName;
    setLocalStyleMapping(newStyleMapping);
    setStyleMapping(newStyleMapping);
  }

  function handleNew(name: string) {
    const newStyleMapping: StyleMapping = {
      ...DefaultStyleMapping,
      name,
      id: randomUUID(),
    };

    setLocalStyleMapping(newStyleMapping);
    setStyleMapping(newStyleMapping);
  }

  function handleAddSinger() {
    const currentNumSingers = Object.keys(localStyleMapping.mapping).length - 1;
    setLocalStyleMapping({
      ...localStyleMapping,
      mapping: {
        ...localStyleMapping.mapping,
        [currentNumSingers]: DefaultStyleOptions1.name,
      },
    });
  }

  function handleDeleteSinger(singer: number) {
    const newStyleMapping: StyleMapping = structuredClone(localStyleMapping);
    delete newStyleMapping.mapping[singer];
    setLocalStyleMapping(newStyleMapping);
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-row items-end mb-4 gap-2">
        <NewStyleMappingDialog
          open={newDialogOpen}
          onOpenChange={setNewDialogOpen}
          onCreate={handleNew}
        />
        <InputStyleMapping
          withLabel
          value={localStyleMapping}
          onChange={setLocalStyleMapping}
          styleMappings={styleMappings}
        />

        <Button variant="outline" onClick={() => setNewDialogOpen(true)}>
          <FontAwesomeIcon icon={faPlus} className="mr-2" size="sm" />
          {t("New")}
        </Button>
        <ActionButton
          variant="outline"
          disabled={localStyleMapping.id === DefaultStyleMapping.id}
          onClick={() => {
            deleteStyleMapping(localStyleMapping.id);
            setLocalStyleMapping(DefaultStyleMapping);
          }}
          actionText={t("Delete")}
          actionIcon={faTrash}
        />
        <ActionButton
          variant="outline"
          onClick={() => setDefaultStyleMappingId(localStyleMapping.id)}
          actionText={t("Set as Default")}
          actionIcon={faCheck}
        />
      </div>

      <div className="flex flex-col gap-4">
        {Object.entries(localStyleMapping.mapping).map(
          ([singer, styleName]) => (
            <div key={singer} className="flex flex-row gap-2 items-center">
              <SingerStyleMapping
                singer={Number(singer)}
                styleName={styleName}
                onChange={(value) => handleChange(Number(singer), value)}
              />
              {![ALL_SINGERS_ID, 0, 1, 2].includes(Number(singer)) && (
                <Button
                  variant="ghost"
                  onClick={() => handleDeleteSinger(Number(singer))}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </Button>
              )}
            </div>
          )
        )}

        <div className="flex flex-row gap-2 items-center">
          <Button variant="outline" onClick={handleAddSinger}>
            <FontAwesomeIcon icon={faPlus} />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface NewStyleMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => void;
}

function NewStyleMappingDialog({
  open,
  onOpenChange,
  onCreate,
}: NewStyleMappingDialogProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");

  function handleCreate() {
    const name = value.trim();
    if (name) {
      onCreate(name);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("New Style Mapping")}</DialogTitle>
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

interface SingerStyleMappingProps {
  singer: number;
  styleName: string;
  onChange: (value: string) => void;
}

export function SingerStyleMapping({
  singer,
  styleName,
  onChange,
}: SingerStyleMappingProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-row gap-2 items-center">
      <div className="w-20">
        {singer === ALL_SINGERS_ID ? (
          <div>{t("All")}</div>
        ) : (
          <div>
            {t("Singer")} {singer + 1}
          </div>
        )}
      </div>
      <div className="w-30">
        <StyleSelect value={styleName} onChange={onChange} />
      </div>
    </div>
  );
}

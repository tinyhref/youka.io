import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudArrowUp, faPlus } from "@fortawesome/free-solid-svg-icons";
import { CreateKaraoke } from "./dialogs/CreateKaraoke";
import { ImportKaraoke } from "./dialogs/ImportKaraoke";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";

export function HeaderMenu() {
  const { t } = useTranslation();
  const [createKaraokeOpen, setCreateKaraokeOpen] = useState(false);
  const [importKaraokeOpen, setImportKaraokeOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        onClick={() => {
          setCreateKaraokeOpen(true);
        }}
      >
        <FontAwesomeIcon icon={faPlus} />
        {t("Create")}
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          setImportKaraokeOpen(true);
        }}
      >
        <FontAwesomeIcon icon={faCloudArrowUp} />
        {t("Import")}
      </Button>

      <CreateKaraoke
        open={createKaraokeOpen}
        onOpenChange={setCreateKaraokeOpen}
      />
      <ImportKaraoke
        open={importKaraokeOpen}
        onOpenChange={setImportKaraokeOpen}
      />
    </>
  );
}

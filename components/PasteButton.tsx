import React from "react";
import { clipboard } from "electron";
import { useTranslation } from "react-i18next";
import { Button, ButtonProps } from "./ui/button";
import { faPaste } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface Props extends ButtonProps {
  onPasteEvent: (q: string) => void;
  showText?: boolean;
}

export default function PasteButton({
  showText,
  onPasteEvent,
  ...props
}: Props) {
  const { t } = useTranslation();

  function handlePaste() {
    const text = clipboard.readText();
    if (text) {
      onPasteEvent(text);
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" onClick={handlePaste} {...props}>
          <FontAwesomeIcon icon={faPaste} />
          {showText && <div className="ml-2">{t("Paste")}</div>}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <div>{t("Paste")}</div>
      </TooltipContent>
    </Tooltip>
  );
}

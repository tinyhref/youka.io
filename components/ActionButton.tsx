import React, { useState } from "react";
import { Button, ButtonProps } from "./ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
export interface ActionButtonProps extends ButtonProps {
  actionText: string;
  actionIcon: IconDefinition;
  doneText?: string;
  doneIcon?: IconDefinition;
  timeout?: number;
}

export function ActionButton({
  actionText,
  actionIcon,
  doneText,
  doneIcon,
  timeout,
  ...props
}: ActionButtonProps) {
  const { t } = useTranslation();
  const [done, setDone] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    props.onClick?.(e);
    setDone(true);
    setTimeout(() => {
      setDone(false);
    }, timeout || 2000);
  };

  return (
    <Button {...props} onClick={handleClick}>
      {done ? (
        <FontAwesomeIcon icon={doneIcon || faCheck} className="mr-2" />
      ) : (
        <FontAwesomeIcon icon={actionIcon} className="mr-2" />
      )}
      {done ? doneText || t("Done") : actionText}
    </Button>
  );
}

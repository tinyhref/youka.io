import React from "react";
import { INotificationUpdate } from "@/types";
import { Button } from "./ui/button";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";

interface Props {
  notification: INotificationUpdate;
}

export function NotificationItemUpdate({ notification }: Props) {
  const { t } = useTranslation();

  function handleClick() {
    window.location.href = "/";
  }
  return (
    <div className="flex flex-row items-center justify-between w-full p-2 hover:bg-slate-100 dark:hover:bg-muted">
      <div className="flex flex-row items-center">
        <FontAwesomeIcon icon={faInfoCircle} className="h-10" />
        <div className="flex flex-col ml-2">
          <div className="text-lg truncate block select-none">
            {t("Update is ready")}
          </div>
          <div className="text-sm dark:text-gray-400 truncate block select-none">
            {t("Click the button to update")}
          </div>
        </div>
      </div>

      <Button className="ml-2" variant="outline" onClick={handleClick}>
        {t("Update")}
      </Button>
    </div>
  );
}

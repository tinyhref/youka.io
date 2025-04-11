import React from "react";
import { useTranslation } from "react-i18next";
import { INotificationAll } from "@/types";
import { NotificationItem } from "./NotificationItem";

interface Props {
  notifications: INotificationAll[];
}

export function Notifications({ notifications }: Props) {
  const { t } = useTranslation();

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center text-gray-500">
        {t("No new notifications")}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
}

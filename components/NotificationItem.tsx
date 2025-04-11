import React from "react";
import { INotificationAll } from "@/types";
import { NotificationItemUpdate } from "./NotificationItemUpdate";

interface Props {
  notification: INotificationAll;
}

export function NotificationItem({ notification }: Props) {
  switch (notification.type) {
    case "update":
      return <NotificationItemUpdate notification={notification} />;
    default:
      return null;
  }
}

import React from "react";
import { useTranslation } from "react-i18next";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Notifications } from "@/components/Notifications";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { Button } from "../ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { usePlayerStore } from "@/stores/player";
import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export default function NotificationsPopover() {
  const { t } = useTranslation();
  const [notifications] = usePlayerStore((state) => [state.notifications]);
  const numNoRead = notifications.filter((n) => !n.read).length;

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button className="relative" variant="outline">
              {numNoRead > 0 && (
                <Badge
                  className="top-0 left-0 absolute -m-2"
                  variant="destructive"
                >
                  {numNoRead}
                </Badge>
              )}
              <FontAwesomeIcon icon={faBell} />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>{t("Notifications")}</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-full px-2 py-2">
        <div className="max-h-96 overflow-auto">
          <div className="w-96">
            <Notifications notifications={notifications} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

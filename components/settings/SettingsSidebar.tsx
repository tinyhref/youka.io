import * as React from "react";
import { Items } from "./items";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cn } from "@/lib/utils";
import { Upgrade } from "../dialogs/Upgrade";

interface SettingsSidebarProps {
  selectedKey: string;
  onSelect: (key: string) => void;
}

export function SettingsSidebar({
  onSelect,
  selectedKey,
}: SettingsSidebarProps) {
  return (
    <div className="flex flex-col gap-2 w-64 ml-4 h-full rounded-md border">
      <Upgrade />
      {Items.map((item) => {
        return (
          <button
            key={item.key}
            className={cn(
              "flex flex-row gap-x-4 p-4 rounded-md hover:bg-muted cursor-pointer items-center",
              selectedKey === item.key ? "bg-muted" : ""
            )}
            onClick={() => onSelect(item.key)}
          >
            <FontAwesomeIcon icon={item.icon} />
            <span>{item.Title()}</span>
          </button>
        );
      })}
    </div>
  );
}

import React from "react";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { CommandShortcut } from "../ui/command";

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  tooltip: string;
  Icon: React.ElementType;
  keepWhenDisabled?: boolean;
  shortcut?: string;
}

export function ActionButton({
  onClick,
  disabled,
  tooltip,
  Icon,
  keepWhenDisabled,
  shortcut,
}: ActionButtonProps) {
  if (disabled && !keepWhenDisabled) return null;

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Button variant="outline" onClick={onClick} disabled={disabled}>
          <Icon className="w-4 h-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {tooltip}

        {shortcut && (
          <CommandShortcut className="ml-1">({shortcut})</CommandShortcut>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

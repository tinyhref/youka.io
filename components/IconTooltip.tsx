import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";

interface Props {
  children: React.ReactNode;
  icon?: any;
  className?: string;
}

export function IconTooltip({
  children,
  className,
  icon = faInfoCircle,
}: Props) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <FontAwesomeIcon icon={icon} className={className} />
      </TooltipTrigger>
      <TooltipContent className="max-w-[300px]">{children}</TooltipContent>
    </Tooltip>
  );
}

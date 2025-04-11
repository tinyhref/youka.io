import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faForwardStep } from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils";

interface Props {
  onClick: () => void;
  className?: string;
}

export function Next({ className, onClick }: Props) {
  return (
    <FontAwesomeIcon
      onClick={onClick}
      icon={faForwardStep}
      className={cn(
        className,
        "cursor-pointer w-[20px] h-[20px] text-white bg-opacity-60"
      )}
    />
  );
}

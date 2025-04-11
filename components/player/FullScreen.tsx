import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExpand, faCompress } from "@fortawesome/free-solid-svg-icons";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  fullScreen: boolean;
}

export function FullScreen({ fullScreen, ...props }: Props) {
  return (
    <div {...props}>
      <FontAwesomeIcon
        icon={fullScreen ? faCompress : faExpand}
        className="cursor-pointer w-[20px] h-[20px] text-white bg-opacity-60"
      />
    </div>
  );
}

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

export function Fallback() {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center">
      <FontAwesomeIcon icon={faSpinner} spin size="2x" />
    </div>
  );
}

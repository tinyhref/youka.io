import React from "react";
import { Button } from "../ui/button";
import { useSyncStore } from "./store";
import { PlusIcon } from "@heroicons/react/20/solid";
import { MinusIcon } from "lucide-react";

export function Zoom() {
  const pixelsPerSecond = useSyncStore((state) => state.pixelsPerSecond);
  const setPixelsPerSecond = useSyncStore((state) => state.setPixelsPerSecond);

  const step = 50;
  const maxPixelsPerSecond = 1000;
  const minPixelsPerSecond = 50;

  const handleZoomIn = () => {
    const newPixelsPerSecond = pixelsPerSecond + step;
    if (newPixelsPerSecond > maxPixelsPerSecond) return;
    setPixelsPerSecond(newPixelsPerSecond);
  };

  const handleZoomOut = () => {
    const newPixelsPerSecond = pixelsPerSecond - step;
    if (newPixelsPerSecond < minPixelsPerSecond) return;
    setPixelsPerSecond(newPixelsPerSecond);
  };

  return (
    <div className="flex flex-row items-center justify-center gap-2">
      <Button
        variant="outline"
        onClick={handleZoomIn}
        disabled={pixelsPerSecond + step >= maxPixelsPerSecond}
      >
        <PlusIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        onClick={handleZoomOut}
        disabled={pixelsPerSecond - step <= minPixelsPerSecond}
      >
        <MinusIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}

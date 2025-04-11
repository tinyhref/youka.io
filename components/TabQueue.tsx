import React from "react";
import { usePlayerStore } from "@/stores/player";
import SongItemList from "./SongItemList";

export default function TabQueue() {
  const queue = usePlayerStore((state) => state.queue);

  return (
    <div className="h-[85vh] overflow-y-auto overflow-x-hidden grow-1 rounded-md border">
      <SongItemList songs={queue} variant="queue" />
    </div>
  );
}

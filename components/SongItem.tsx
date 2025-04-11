import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ISongQueue, JobStateUnion, Song } from "@/types";
import Title from "@/components/Title";
import { cn } from "@/lib/utils";
import { SongImage } from "./SongImage";
import { JobStatus } from "./JobStatus";
import { usePlayerStore } from "@/stores/player";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faGripLines,
  faMinusCircle,
  faPlusCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useToast } from "@/components/ui/use-toast";
import { useDrag, useDrop } from "react-dnd";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  song: Song;
  job?: JobStateUnion;
  onClick?: () => void;
  current?: boolean;
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  variant: "notification" | "queue" | "default";
}

export interface Item {
  id: string;
  originalIndex: number;
}

export function SongItem({
  song,
  job,
  current,
  children,
  onClick,
  variant,
  title,
  subtitle,
}: Props) {
  const { t } = useTranslation();
  const [
    songs,
    addToQueue,
    removeFromQueue,
    cancelJob,
    queue,
    moveSong,
  ] = usePlayerStore((state) => [
    state.songs,
    state.addToQueue,
    state.removeFromQueue,
    state.cancelJob,
    state.queue,
    state.moveSong,
  ]);

  const findSongCb = useCallback(
    (qid: string) => {
      const index = queue.findIndex((c) => c.qid === qid);
      return {
        song: queue[index],
        index,
      };
    },
    [queue]
  );

  const moveSongCb = useCallback(
    (qid: string, atIndex: number) => {
      const { index } = findSongCb(qid);
      moveSong(index, atIndex);
    },
    [findSongCb, moveSong]
  );

  const [isHovering, setIsHovering] = useState(false);
  const { toast } = useToast();
  const processed = songs[song.id]?.status === "processed";
  const originalIndex = findSongCb(song.qid || "").index;

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: variant,
      item: { id: song.qid || "", originalIndex },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      end: (item, monitor) => {
        const { id: droppedId, originalIndex } = item;
        const didDrop = monitor.didDrop();
        if (!didDrop) {
          moveSongCb(droppedId, originalIndex);
        }
      },
    }),
    [song.qid, originalIndex, moveSongCb]
  );

  const [, drop] = useDrop(
    () => ({
      accept: "queue",
      hover({ id: draggedId }: Item) {
        if (draggedId !== song.qid) {
          const overIndex = findSongCb(song.qid || "").index;
          moveSongCb(draggedId, overIndex);
        }
      },
    }),
    [findSongCb, moveSongCb]
  );

  function handleCancelJob() {
    if (!job) return;
    cancelJob(job.id);
  }

  function handleAddToQueue(e: any, song: Song) {
    e.stopPropagation();
    addToQueue(song);
    toast({
      title: "Added to queue",
      description: song.title,
      image: song.image,
    });
  }

  function handleRemoveFromQueue(e: any, song: Song) {
    e.stopPropagation();
    if (!song.qid) return;
    removeFromQueue(song as ISongQueue);
    toast({
      title: "Removed from queue",
      description: song.title,
      image: song.image,
    });
  }

  function renderIcon() {
    if (job && isHovering && ["pending", "running"].includes(job.status)) {
      return (
        <div className="flex flex-row">
          <JobStatus job={job} showProgressOutside />
          <div className="ml-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <FontAwesomeIcon
                  color="#e63946"
                  onClick={handleCancelJob}
                  icon={faMinusCircle}
                />
              </TooltipTrigger>
              <TooltipContent>{t("Cancel")}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      );
    } else if (job) {
      return <JobStatus job={job} showProgressOutside />;
    } else if (isHovering && variant === "queue") {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <FontAwesomeIcon
              color="#e63946"
              onClick={(e: any) => handleRemoveFromQueue(e, song)}
              icon={faMinusCircle}
            />
          </TooltipTrigger>
          <TooltipContent>{t("Remove from queue")}</TooltipContent>
        </Tooltip>
      );
    } else if (isHovering && variant === "default") {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <FontAwesomeIcon
              color="#457b9d"
              onClick={(e: any) => handleAddToQueue(e, song)}
              icon={faPlusCircle}
            />
          </TooltipTrigger>
          <TooltipContent>{t("Add to queue")}</TooltipContent>
        </Tooltip>
      );
    } else {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <FontAwesomeIcon
              color="#588157"
              icon={faCheckCircle}
              className={cn(processed && !job ? "visible" : "invisible")}
            />
          </TooltipTrigger>
          <TooltipContent>{t("Ready")}</TooltipContent>
        </Tooltip>
      );
    }
  }

  return (
    <div
      ref={variant === "queue" ? (node) => drag(drop(node)) : null}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={onClick}
      className={cn(
        "flex flex-row items-center group cursor-pointer p-2 hover:bg-slate-100 dark:hover:bg-muted w-full",
        current ? "bg-slate-100 dark:bg-muted" : ""
      )}
      style={{
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {variant === "queue" && (
        <FontAwesomeIcon icon={faGripLines} size="sm" className="mr-2" />
      )}
      <div className="min-w-[100px] rounded-lg pr-2">
        <SongImage song={song} />
      </div>
      <div className="truncate w-full">
        <Title
          title={title || song.songTitle || song.title}
          artists={song.artists || []}
        />
      </div>
      <div>{children}</div>
      <div className="px-2">{renderIcon()}</div>
    </div>
  );
}

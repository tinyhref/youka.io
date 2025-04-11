import React, { useRef } from "react";
import { GripVertical } from "lucide-react";

interface ResizableTimeProps {
  start: number; // current 'start' time in seconds
  end: number; // current 'end' time in seconds
  onChange: (start: number, end: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: (start: number, end: number) => void;
  children: React.ReactNode;
  pixelsPerSecond: number; // how many pixels represent 1 second
  disabled?: boolean;
}

export const ResizableTime: React.FC<ResizableTimeProps> = ({
  start,
  end,
  onChange,
  onResizeStart,
  onResizeEnd,
  children,
  pixelsPerSecond,
  disabled,
}) => {
  const startRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  function calculateNewStart(
    clientX: number,
    initialX: number,
    initialStart: number
  ) {
    const deltaX = clientX - initialX;
    const shiftSeconds = deltaX / pixelsPerSecond;
    const newStart = initialStart + shiftSeconds;
    const clampedNewStart = Math.min(newStart, end);
    return clampedNewStart;
  }

  function calculateNewEnd(
    clientX: number,
    initialX: number,
    initialEnd: number
  ) {
    const deltaX = clientX - initialX;
    const shiftSeconds = deltaX / pixelsPerSecond;
    const newEnd = initialEnd + shiftSeconds;
    const clampedNewEnd = Math.max(newEnd, start);
    return clampedNewEnd;
  }

  const handleStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    onResizeStart?.();

    const initialX = e.clientX;
    const initialStart = start;

    const onMouseMove = (event: MouseEvent) => {
      const newStart = calculateNewStart(event.clientX, initialX, initialStart);
      onChange(newStart, end);
    };

    const onMouseUp = (event: MouseEvent) => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      const newStart = calculateNewStart(event.clientX, initialX, initialStart);
      onResizeEnd?.(newStart, end);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const handleEnd = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    onResizeStart?.();

    const initialX = e.clientX;
    const initialEnd = end;

    const onMouseMove = (event: MouseEvent) => {
      const newEnd = calculateNewEnd(event.clientX, initialX, initialEnd);
      onChange(start, newEnd);
    };

    const onMouseUp = (event: MouseEvent) => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      const newEnd = calculateNewEnd(event.clientX, initialX, initialEnd);
      onResizeEnd?.(start, newEnd);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  if (disabled) {
    // If resizing is disabled, just render the children without handles
    return <>{children}</>;
  }

  return (
    <div className="relative h-full">
      {/* Left handle to resize the 'start' */}
      <div
        ref={startRef}
        onMouseDown={handleStart}
        className="absolute left-0 top-0 h-full bg-blue-500 cursor-col-resize z-10 w-2 flex items-center justify-center"
      >
        <GripVertical className="h-4 w-4 text-white" />
      </div>

      {children}

      {/* Right handle to resize the 'end' */}
      <div
        ref={endRef}
        onMouseDown={handleEnd}
        className="absolute right-0 top-0 h-full bg-blue-500 cursor-col-resize z-10 w-2 flex items-center justify-center"
      >
        <GripVertical className="h-4 w-4 text-white" />
      </div>
    </div>
  );
};

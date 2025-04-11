"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const LoaderProgress = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-black bg-opacity-70">
      <SliderPrimitive.Range
        className="absolute h-full bg-primary"
        style={{ backgroundColor: props.color }}
      />
    </SliderPrimitive.Track>
  </SliderPrimitive.Root>
));
LoaderProgress.displayName = SliderPrimitive.Root.displayName;

export { LoaderProgress };

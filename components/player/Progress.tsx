"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative cursor-pointer flex touch-none select-none items-center w-[100px] bg-opacity-20 bg-white",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden">
      <SliderPrimitive.Range
        className="absolute h-full bg-primary"
        style={{ backgroundColor: props.color }}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className="block h-[12px] w-[12px] rounded-full bg-primary"
      style={{ backgroundColor: props.color }}
    />
  </SliderPrimitive.Root>
));
Progress.displayName = SliderPrimitive.Root.displayName;

export { Progress };

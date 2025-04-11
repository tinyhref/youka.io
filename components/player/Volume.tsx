"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  IconDefinition,
  faMinus,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { UpgradeLabel } from "../UpgradeLabel";

type CustomVolumeProps = {
  title: string;
  icon: IconDefinition;
  mutedIcon: IconDefinition;
  onClickIcon: () => void;
  render?: (value: number) => React.ReactNode;
  full?: boolean;
};

type VolumeProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> &
  CustomVolumeProps;

const Volume = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  VolumeProps
>(
  (
    {
      full,
      className,
      title,
      icon,
      mutedIcon,
      onClickIcon,
      onValueChange,
      value,
      step,
      min,
      max,
      render,
      ...props
    },
    ref
  ) => {
    const [isHovering, setIsHovering] = React.useState(false);
    const muted = value?.length && value[0] === 0;

    const upgradeTitle = (
      <>
        {title}
        <span className="mx-2">
          <UpgradeLabel feature="Key and Tempo Volume" role="pro" />
        </span>
      </>
    );

    function handleUp() {
      if (
        !onValueChange ||
        !value?.length ||
        step === undefined ||
        max === undefined
      )
        return;
      let newValue = parseFloat((value[0] + step).toFixed(2));
      if (newValue > max) {
        newValue = max;
      }
      onValueChange([newValue]);
    }

    function handleDown() {
      if (
        !onValueChange ||
        !value?.length ||
        step === undefined ||
        min === undefined
      )
        return;
      let newValue = parseFloat((value[0] - step).toFixed(2));
      if (newValue < min) {
        newValue = min;
      }
      onValueChange([newValue]);
    }

    return (
      <div
        className={cn("flex flex-row items-center", className)}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <FontAwesomeIcon
              icon={muted ? mutedIcon : icon}
              className="w-[20px] h-[20px] text-white bg-opacity-60 cursor-pointer"
              onClick={onClickIcon}
            />
          </TooltipTrigger>
          <TooltipContent>{title}</TooltipContent>
        </Tooltip>
        {(full || isHovering) && (
          <Tooltip open={isHovering}>
            <TooltipTrigger asChild>
              <div className="flex flex-row items-center justify-center">
                <SliderPrimitive.Root
                  ref={ref}
                  className="relative cursor-pointer flex touch-none select-none items-center w-[100px] h-[4px] bg-opacity-20 bg-white mx-3"
                  value={value}
                  step={step}
                  onValueChange={onValueChange}
                  min={min}
                  max={max}
                  {...props}
                >
                  <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full">
                    <SliderPrimitive.Range
                      className="absolute h-full bg-white"
                      style={{ backgroundColor: props.color }}
                    />
                  </SliderPrimitive.Track>
                  <SliderPrimitive.Thumb
                    className="block h-[12px] w-[12px] rounded-full bg-white"
                    style={{ backgroundColor: props.color }}
                  />
                </SliderPrimitive.Root>
                <FontAwesomeIcon
                  icon={faMinus}
                  className="text-white cursor-pointer select-none p-1"
                  onClick={handleDown}
                  size="xs"
                />
                <FontAwesomeIcon
                  icon={faPlus}
                  className="text-white cursor-pointer select-none p-1"
                  onClick={handleUp}
                  size="xs"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent className="flex flex-row items-center">
              {props.disabled
                ? upgradeTitle
                : render && value
                ? render(value[0])
                : value}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  }
);

Volume.displayName = SliderPrimitive.Root.displayName;

export { Volume };

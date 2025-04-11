"use client";

import * as React from "react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { AspectRatio } from "./aspect-ratio";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleXmark,
} from "@fortawesome/free-regular-svg-icons";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider duration={4000}>
      {toasts.map(function ({
        id,
        title,
        description,
        image,
        action,
        variant,
        ...props
      }) {
        return (
          <Toast key={id} {...props} className="my-2">
            <div className="flex flex-row items-center">
              {variant === "success" && (
                <FontAwesomeIcon
                  className="text-2xl m-2"
                  icon={faCircleCheck}
                />
              )}
              {variant === "destructive" && (
                <FontAwesomeIcon
                  className="text-2xl m-2"
                  icon={faCircleXmark}
                />
              )}
              {image && (
                <div className="w-[100px]">
                  <AspectRatio ratio={16 / 9}>
                    <img
                      className="object-cover w-full h-full"
                      src={image}
                      alt=""
                    />
                  </AspectRatio>
                </div>
              )}
              <div className="flex flex-col p-2 items-start">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

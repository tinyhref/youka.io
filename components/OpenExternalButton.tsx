import React from "react";
import { Button, ButtonProps } from "./ui/button";
import { shell } from "electron";

interface Props {
  url: string;
}

export const OpenExternalButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & Props
>(({ url, ...props }, ref) => {
  return (
    <Button
      onClick={() => {
        shell.openExternal(url);
      }}
      ref={ref}
      {...props}
    />
  );
});

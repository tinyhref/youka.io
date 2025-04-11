import * as React from "react";
import { Label } from "../ui/label";
import { IconTooltip } from "../IconTooltip";

interface Props {
  title?: string;
  tooltip?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
}

export const SettingsItemContainer = ({
  title,
  tooltip,
  description,
  children,
}: Props) => (
  <div className="flex flex-col gap-2 my-4">
    <div className="flex items-center gap-2">
      {title && <Label>{title}</Label>}
      {tooltip && <IconTooltip>{tooltip}</IconTooltip>}
      {description && (
        <div className="text-sm text-gray-500 mb-2">{description}</div>
      )}
    </div>
    <div>{children}</div>
  </div>
);

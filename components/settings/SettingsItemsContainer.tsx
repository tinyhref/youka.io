import * as React from "react";
import { Accordion } from "../ui/accordion";

interface Props {
  children: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
}

export const SettingsItemsContainer = ({
  children,
  value,
  onValueChange,
}: Props) => {
  return (
    <Accordion
      type="single"
      collapsible
      value={value}
      onValueChange={onValueChange}
    >
      {children}
    </Accordion>
  );
};

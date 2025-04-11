import * as React from "react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";

interface SettingResetProps {
  settings: any;
  setSettings: (settings: any) => void;
}
interface Props {
  title: string;
  description?: string;
  children: React.ReactNode;
  value?: string;
  reset?: SettingResetProps;
}

export const SettingsContainer = ({
  title,
  description,
  children,
  value,
  reset,
}: Props) => {
  const { t } = useTranslation();

  return (
    <AccordionItem value={title}>
      <AccordionTrigger>
        <div className="flex flex-row w-full items-center justify-between">
          {title}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="flex flex-col">
          {description && (
            <div className="text-sm text-gray-500 mb-2">{description}</div>
          )}
        </div>
        {children}
        {reset && (
          <Button
            variant="outline"
            className="mt-2"
            onClick={(e) => {
              e.stopPropagation();
              reset.setSettings(reset.settings);
            }}
          >
            {t("Reset")}
          </Button>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};

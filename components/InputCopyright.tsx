import React from "react";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useTranslation } from "react-i18next";
interface CopyrightInputProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export default function InputCopyright({
  value,
  onChange,
}: CopyrightInputProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-row items-center gap-2">
      <Checkbox
        id="copyright"
        checked={value}
        onCheckedChange={(checked) => onChange(Boolean(checked))}
      />
      <Label htmlFor="copyright">
        {t("copyright.title.a")}{" "}
        <Tooltip>
          <TooltipTrigger className="font-bold">
            {t("copyright.title.b")}
          </TooltipTrigger>
          <TooltipContent className="max-w-[300px]">
            {t("copyright.description")}
          </TooltipContent>
        </Tooltip>
      </Label>
    </div>
  );
}

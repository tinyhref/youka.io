import React from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import { Label } from "./ui/label";
import { StyleMapping } from "@/types";
import { useTranslation } from "react-i18next";

interface InputStyleMappingProps {
  value: StyleMapping;
  onChange: (value: StyleMapping) => void;
  styleMappings: StyleMapping[];
  withLabel?: boolean;
}
export default function InputStyleMapping({
  value,
  onChange,
  withLabel,
  styleMappings,
}: InputStyleMappingProps) {
  const { t } = useTranslation();

  function handleChange(value: string) {
    const styleMapping = styleMappings.find((mapping) => mapping.id === value);
    if (styleMapping) {
      onChange(styleMapping);
    }
  }
  return (
    <div className="flex flex-col gap-2">
      {withLabel && <Label>{t("Style Mapping")}</Label>}
      <Select onValueChange={handleChange} value={value.id}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Style Mapping" />
        </SelectTrigger>
        <SelectContent>
          {styleMappings.map((mapping) => (
            <SelectItem key={mapping.id} value={mapping.id}>
              {mapping.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

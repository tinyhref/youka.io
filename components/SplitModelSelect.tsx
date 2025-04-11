import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { SplitModelId2Label } from "./Labels";
import { Label } from "./ui/label";
import { useTranslation } from "react-i18next";

interface Props {
  value: string;
  onValueChange: (value: string) => void;
}

export function SplitModelLabel() {
  const { t } = useTranslation();
  return <Label>{t("Separate Model")}</Label>;
}

const models = [
  "auto",
  "demucs",
  "uvr_mdxnet_kara_2",
  "bs_roformer",
  "mdx23c",
  "mel_band_roformer_instrumental_becruily",
  "mel_band_roformer_instrumental_instv7_gabox",
];

export function SplitModelSelect({ value, onValueChange }: Props) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="max-w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {models.map((model) => (
          <SelectItem key={model} value={model}>
            <SplitModelId2Label modelId={model} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

import React, { useState, useEffect } from "react";
import { getFonts } from "@/lib/fonts";
import { Combobox2, ComboboxOption } from "@/components/ui/combobox2";
import { Label } from "@/components/ui/label";

export interface FontInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function FontInput({ label, value, onChange }: FontInputProps) {
  const [fonts, setFonts] = useState<ComboboxOption[]>([]);

  useEffect(() => {
    async function ffonts() {
      const systemFonts = await getFonts();
      const fonts: ComboboxOption[] = systemFonts.map((font, index: number) => {
        return {
          id: index.toString(),
          label: font.name,
          value: font.name,
        };
      });
      setFonts(fonts);
    }
    ffonts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col">
      <Label>{label}</Label>
      <div className="my-2">
        <Combobox2 value={value} options={fonts} onChange={onChange} />
      </div>
    </div>
  );
}

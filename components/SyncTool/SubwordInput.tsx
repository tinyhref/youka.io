import React from "react";
import { Input } from "../ui/input";
import { useSyncStore } from "./store";
import { SyncAlignmentSubword } from "./types";

interface SubwordInputProps {
  subword: SyncAlignmentSubword;
}
export const SubwordInput = ({ subword }: SubwordInputProps) => {
  const updateSubwordText = useSyncStore((state) => state.updateSubwordText);
  const rtl = useSyncStore((state) => state.rtl);
  return (
    <Input
      dir={rtl ? "rtl" : "ltr"}
      type="text"
      style={{
        width: subword.text.length * 10,
        minWidth: 150,
      }}
      className="text-lg"
      value={subword.text}
      onChange={(e) => updateSubwordText(subword.subwordId, e.target.value)}
    />
  );
};

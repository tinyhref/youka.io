import React from "react";

interface Props {
  children: React.ReactNode;
}

export function SettingRow({ children }: Props) {
  return <div className="flex flex-row items-center gap-4">{children}</div>;
}

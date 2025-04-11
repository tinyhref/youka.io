import React from "react";

interface Props {
  onClick?: () => void;
  icon: JSX.Element;
  title: string;
  description: string | React.ReactNode;
}

export function CTA({ onClick, icon, title, description }: Props) {
  return (
    <div
      className="flex flex-row w-full min-w-[400px] min-h-40 items-center gap-4 hover:bg-secondary/80 p-8 rounded border-2 cursor-default"
      onClick={onClick}
    >
      <div className="flex flex-col items-center justify-center h-full pr-4">
        <div className="text-4xl">{icon}</div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-2xl">{title}</div>
        <div className="text-sm">{description}</div>
      </div>
    </div>
  );
}

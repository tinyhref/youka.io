import React from "react";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  artists: string[];
}

export default function TitleComp({ title, artists, ...props }: Props) {
  return (
    <div className="flex flex-col" {...props}>
      <div className="text-lg truncate block select-none">{title}</div>
      {artists.length > 0 && (
        <div className="text-sm dark:text-gray-400 truncate block select-none">
          {artists?.join(" • ")}
        </div>
      )}
    </div>
  );
}

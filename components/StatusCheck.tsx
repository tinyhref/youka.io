import React, { useEffect, useState } from "react";
import * as report from "@/lib/report";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "./ui/button";
import { faWarning } from "@fortawesome/free-solid-svg-icons";

interface Props {
  title: string;
  description: string[];
  fn: () => Promise<boolean>;
  checkInterval: number;
}

export default function StatusCheck({
  title,
  description,
  fn,
  checkInterval,
}: Props) {
  const [ok, setOk] = useState<boolean>();
  const [ready, setReady] = useState(false);

  async function check() {
    try {
      const ok = await fn();
      setOk(ok);
      setReady(true);
    } catch (e) {
      report.error(e as any);
    }
  }

  useEffect(() => {
    let interval = setInterval(() => {
      check();
    }, checkInterval);

    return () => {
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready || ok) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="destructive" onClick={check}>
          <FontAwesomeIcon
            icon={faWarning}
            className="w-4 h-4 text-white bg-opacity-60 mr-2"
          />
          {title}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <div className="flex flex-col text-sm gap-2">
          {description.map((line) => {
            return <div key={line}>{line}</div>;
          })}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

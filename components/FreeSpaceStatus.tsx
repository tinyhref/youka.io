import React from "react";
import checkDiskSpace from "check-disk-space";
import { useTranslation } from "react-i18next";
import StatusCheck from "@/components/StatusCheck";

interface Props {
  path: string;
  min: number;
  checkInterval: number;
}

export function FreeSpaceStatus({ checkInterval, path, min }: Props) {
  const { t } = useTranslation();

  async function checkSpace() {
    try {
      const dspace = await checkDiskSpace(path);
      const free = Math.floor(dspace.free / 1000 / 1000 / 1000);
      return free > min;
    } catch (e) {
      // report.error(e as any);
      return true;
    }
  }

  return (
    <StatusCheck
      fn={checkSpace}
      title={t("Storage is Full")}
      checkInterval={checkInterval}
      description={[
        t("Youka is running out of storage space"),
        t("Please free up at least 1 GB before creating new karaoke"),
        t("Click the button to check again"),
      ]}
    />
  );
}

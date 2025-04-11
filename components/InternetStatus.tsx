import React from "react";
import dns from "node:dns";
import { useTranslation } from "react-i18next";
import StatusCheck from "@/components/StatusCheck";

interface Props {
  checkInterval: number;
}

export function InternetStatus({ checkInterval }: Props) {
  const { t } = useTranslation();

  async function checkInternet() {
    try {
      await dns.promises.lookup("google.com");
      return true;
    } catch {
      return false;
    }
  }

  return (
    <StatusCheck
      fn={checkInternet}
      title={t("No Internet Connection")}
      checkInterval={checkInterval}
      description={[
        t("Youka cannot connect to the internet"),
        t("Please make sure you have internet connection"),
        t("Click the button to check again"),
      ]}
    />
  );
}

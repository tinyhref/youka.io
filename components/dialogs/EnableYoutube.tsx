import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { shell } from "electron";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "../ui/checkbox";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ytdlp from "@/lib/binary/yt-dlp";
import { useToast } from "../ui/use-toast";
import * as report from "@/lib/report";

interface Props {
  onAccept: () => void;
  onCancel: () => void;
}

export const EnableYoutube = ({ onAccept, onCancel }: Props) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);
  const { toast } = useToast();

  const warnings: any = t("dialogs.youtube.warnings", {
    defaultValue: [] as any,
    returnObjects: true,
  });

  async function handleEnable() {
    try {
      setLoading(true);
      await ytdlp.install();
      onAccept();
      toast({
        variant: "success",
        title: t("dialogs.youtube.install_success"),
        description: t("dialogs.youtube.install_success_description"),
      });
    } catch (e) {
      if (e instanceof Error) {
        toast({
          variant: "destructive",
          title: t("dialogs.youtube.install_error"),
          description: e.message,
        });
        report.error(e);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={true}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialogs.youtube.title")}</DialogTitle>
          <DialogDescription>
            <>
              {t("dialogs.youtube.description")}{" "}
              <span
                className="text-blue-500 hover:underline hover:cursor-pointer"
                onClick={() =>
                  shell.openExternal("https://github.com/yt-dlp/yt-dlp")
                }
              >
                project website
              </span>
            </>
          </DialogDescription>
        </DialogHeader>
        <div>
          <div className="max-h-[50vh] overflow-auto space-y-4">
            {warnings.map((warning: any, index: number) => (
              <div key={index}>
                <div className="font-bold">{warning.title}</div>
                <div className="text-sm">{warning.description}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center space-x-2 mt-6">
            <Checkbox
              id="terms"
              onCheckedChange={(checked) => {
                setAgree(checked as boolean);
              }}
            />
            <label htmlFor="terms">{t("dialogs.youtube.agree")}</label>
          </div>
        </div>

        <DialogFooter>
          <div className="flex flex-row gap-2">
            <Button
              disabled={loading}
              variant="secondary"
              onClick={() => {
                onCancel();
              }}
            >
              {t("Cancel")}
            </Button>
            <Button disabled={!agree || loading} onClick={handleEnable}>
              {t("dialogs.youtube.install")}
              {loading && (
                <FontAwesomeIcon
                  className="ml-2"
                  icon={faSpinner}
                  spin={loading}
                />
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

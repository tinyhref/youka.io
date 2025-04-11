import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { InputChangeBackground, ISongProcessed, ISongStem } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { usePlayerStore } from "@/stores/player";
import ffprobe from "@/lib/binary/ffprobe";
import InputVideoSource from "../InputVideoSource";
import { videoSourceSchema } from "@/schemas";
import { useSettingsStore } from "@/stores/settings";
import { DefaultVideoSourceVideo } from "@/consts";

interface Props {
  song: ISongProcessed;
  selectedInstruments: ISongStem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FormSchema = z.object({
  videoSource: videoSourceSchema,
});

export const EditBackground = ({
  open,
  onOpenChange,
  song,
  selectedInstruments,
}: Props) => {
  const [changeBackground] = usePlayerStore((state) => [
    state.changeBackground,
  ]);
  const [ffmpegOptions] = useSettingsStore((state) => [state.ffmpegOptions]);
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      videoSource: DefaultVideoSourceVideo,
    },
  });
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      form.reset({
        videoSource: DefaultVideoSourceVideo,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleSubmit(values: z.infer<typeof FormSchema>) {
    try {
      setLoading(true);
      const duration = await ffprobe.duration(selectedInstruments.filepath);
      const input: InputChangeBackground = {
        song,
        videoSource: values.videoSource,
        duration,
        ffmpegOptions,
      };
      await changeBackground(input);
      onOpenChange(false);
      toast({
        title: "Background changed successfully",
        description: song.title,
        image: song.image,
      });
    } catch (err) {
      toast({
        title: "Background change failed",
        description: song.title,
        image: song.image,
      });
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Change Background")}</DialogTitle>
        </DialogHeader>

        <div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="videoSource"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormControl>
                      <InputVideoSource
                        withAspectRatio
                        onChange={field.onChange}
                        value={field.value}
                        setAsDefault={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  {t("Cancel")}
                </Button>
                <Button disabled={loading} type="submit">
                  {t("Save")}
                  {loading && (
                    <FontAwesomeIcon
                      icon={faSpinner}
                      spin={loading}
                      className="ml-2"
                    />
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

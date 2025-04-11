import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { ffmpegTransitionOptionsSchema, videoSourceSchema } from "@/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSettingsStore } from "@/stores/settings";
import { Form, FormLabel } from "../ui/form";
import { FormField } from "../ui/form";
import { FormItem } from "../ui/form";
import { FormControl } from "../ui/form";
import InputVideoSource from "../InputVideoSource";
import { DefaultVideoSourceVideo } from "@/consts";
import { Input } from "../ui/input";
import { usePlayerStore } from "@/stores/player";
import { InputAddKaraokeIntro, ISongProcessed } from "@/types";
import { useToast } from "../ui/use-toast";
import { getVideoResolution, resolutionToAspectRatio } from "@/lib/library";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import InputFFmpegTransition, {
  DefaultFFmpegTransitionOptions,
} from "../InputFFmpegTransition";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

interface Props {
  song: ISongProcessed;
  videoId: string;
  stemId: string;
  alignmentId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  videoSource: videoSourceSchema,
  duration: z.number().min(1).max(60),
  transition: ffmpegTransitionOptionsSchema,
});

export const AddKaraokeIntro = ({
  song,
  videoId,
  stemId,
  alignmentId,
  open,
  onOpenChange,
}: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const addKaraokeIntro = usePlayerStore((state) => state.addKaraokeIntro);
  const ffmpegOptions = useSettingsStore((state) => state.ffmpegOptions);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      videoSource: DefaultVideoSourceVideo,
      duration: 5,
      transition: DefaultFFmpegTransitionOptions,
    },
  });

  const videoSource = form.watch("videoSource");

  useEffect(() => {
    if (!open) {
      form.reset({
        videoSource: DefaultVideoSourceVideo,
        duration: 5,
        transition: DefaultFFmpegTransitionOptions,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);

      const stem = song.stems.find((s) => s.id === stemId);
      if (!stem) {
        toast({
          title: "Stem not found",
          description: "Stem not found",
        });
        return;
      }

      const resolution = await getVideoResolution(song, videoId);
      const aspectRatio = resolutionToAspectRatio(resolution);
      switch (values.videoSource.type) {
        case "video":
        case "image":
          values.videoSource.aspectRatio = aspectRatio;
          values.videoSource.resolution = resolution;
          break;
        case "color":
          values.videoSource.resolution = resolution;
          break;
        default:
          toast({
            title: "Invalid video source",
            description: "Invalid video source",
          });
          return;
      }

      const input: InputAddKaraokeIntro = {
        videoSource: values.videoSource,
        duration: values.duration,
        videoId,
        alignmentId,
        stemModelId: stem.modelId,
        ffmpegOptions: ffmpegOptions,
        song,
        transition: values.transition,
      };

      addKaraokeIntro(input);

      toast({
        title: "Job started",
        description: "Follow the progress in the jobs tab",
      });

      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Add Intro Video")}</DialogTitle>
          <DialogDescription>
            {t("dialogs.intro.description")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="videoSource"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <InputVideoSource
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {videoSource.type !== "video" && (
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("Duration")} ({t("Seconds")})
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="w-1/3"
                        type="number"
                        value={field.value}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <Accordion type="single" collapsible>
              <AccordionItem value="transition">
                <AccordionTrigger>{t("Transition")}</AccordionTrigger>
                <AccordionContent>
                  <FormField
                    control={form.control}
                    name="transition"
                    render={({ field }) => (
                      <FormItem className="w-1/3">
                        <FormControl>
                          <InputFFmpegTransition
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
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
      </DialogContent>
    </Dialog>
  );
};

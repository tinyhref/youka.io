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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  initSongDir,
  getJPEGImageFileURL,
  getPathFromKaraokeFile,
} from "@/lib/library";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePlayerStore } from "@/stores/player";
import { useToast } from "@/components/ui/use-toast";
import { FileType, ISongPreview } from "@/types";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import * as report from "@/lib/report";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { useSettingsStore } from "@/stores/settings";
import {
  audioSourceSchema,
  subtitlesSourceSchema,
  thumbnailSourceSchema,
  videoSourceSchema,
} from "@/schemas";
import InputVideoSource from "../InputVideoSource";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import InputThumbnailSource from "../InputThumbnailSource";
import InputAudioSource from "../InputAudioSource";
import InputSubtitlesSource from "../InputSubtitlesSource";
import { exists } from "@/lib/utils";
import { randomUUID } from "crypto";
import {
  AspectRatio16x9,
  DEFAULT_BACKGROUND_IMAGE_URL,
  DefaultAudioSourceAudio,
  VideoOptions16x9,
} from "@/consts";
import InputCopyright from "../InputCopyright";

const formSchema = z.object({
  title: z.string().min(1),
  audioSource: audioSourceSchema,
  videoSource: videoSourceSchema,
  thumbnailSource: thumbnailSourceSchema,
  subtitlesSource: subtitlesSourceSchema,
  copyright: z.boolean().refine((value) => Boolean(value), {
    message: "You must accept the music usage confirmation",
  }),
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportKaraoke({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [importKaraoke, setTab] = usePlayerStore((state) => [
    state.importKaraoke,
    state.setTab,
  ]);
  const [
    ffmpegOptions,
    defaultVideoSource,
    defaultThumbnailSource,
    setDefaultVideoSource,
    setDefaultThumbnailSource,
  ] = useSettingsStore((state) => [
    state.ffmpegOptions,
    state.defaultVideoSource,
    state.defaultThumbnailSource,
    state.setDefaultVideoSource,
    state.setDefaultThumbnailSource,
  ]);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      audioSource: DefaultAudioSourceAudio,
      videoSource: defaultVideoSource,
      thumbnailSource: defaultThumbnailSource,
      subtitlesSource: {
        type: "auto",
      },
      copyright: false,
    },
  });

  const audioSource = form.watch("audioSource");

  useEffect(() => {
    if (!open) {
      form.reset({
        title: "",
        thumbnailSource: defaultThumbnailSource,
        videoSource: defaultVideoSource,
        audioSource: DefaultAudioSourceAudio,
        subtitlesSource: {
          type: "auto",
        },
        copyright: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!audioSource.title) return;
    form.setValue("title", audioSource.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioSource]);

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);

      let audioSource = values.audioSource;
      const id = audioSource.id;

      let videoSource = values.videoSource;
      if (videoSource.type === "auto") {
        if (audioSource.type === "karafun") {
          const video = audioSource.extractResult.files.find(
            (f) => f.type === "video"
          );
          if (video) {
            videoSource = {
              id: randomUUID(),
              type: "video",
              filepath: video.filepath,
              duration: audioSource.duration,
              title: audioSource.title,
              aspectRatio: AspectRatio16x9,
            };
          } else {
            videoSource = {
              type: "image",
              url: DEFAULT_BACKGROUND_IMAGE_URL,
              size: 0,
              aspectRatio: AspectRatio16x9,
            };
          }
        } else if (audioSource.type === "audio") {
          videoSource = {
            type: "image",
            url: DEFAULT_BACKGROUND_IMAGE_URL,
            size: 0,
            aspectRatio: AspectRatio16x9,
          };
        } else if (audioSource.type === "video") {
          videoSource = {
            type: "video",
            filepath: audioSource.filepath,
            id: audioSource.id,
            duration: audioSource.duration,
            title: audioSource.title,
            aspectRatio: AspectRatio16x9,
          };
        }
      }

      let subtitlesSource = values.subtitlesSource;
      if (subtitlesSource.type === "auto") {
        if (audioSource.type === "karafun") {
          subtitlesSource = {
            type: "karafun",
            filepath: audioSource.filepath,
            extractResult: audioSource.extractResult,
          };
        } else if (
          audioSource.type === "audio" ||
          audioSource.type === "video"
        ) {
          const lrcFilepath = getPathFromKaraokeFile(
            audioSource.filepath,
            FileType.LRC
          );
          const lrcExists = await exists(lrcFilepath);
          if (lrcExists) {
            subtitlesSource = { type: "lrc", filepath: lrcFilepath };
          } else {
            subtitlesSource = { type: "id3", filepath: audioSource.filepath };
          }
        }
      }

      await initSongDir(id);

      let thumbnailUrl: string;
      if (values.thumbnailSource.type === "auto") {
        if (audioSource.type === "url") {
          thumbnailUrl = audioSource.thumbnail;
        } else if (videoSource.type === "image") {
          thumbnailUrl = videoSource.url;
        } else {
          thumbnailUrl = DEFAULT_BACKGROUND_IMAGE_URL;
        }
      } else {
        thumbnailUrl = values.thumbnailSource.url;
      }

      const thumbnail = await getJPEGImageFileURL(id, thumbnailUrl);

      const song: ISongPreview = {
        type: "song",
        id,
        title: values.title,
        image: thumbnail,
        status: "preview",
      };

      importKaraoke({
        id,
        title: values.title,
        thumbnail,
        song,
        audioSource,
        videoSource,
        subtitlesSource,
        ffmpegOptions,
        videoOptions: VideoOptions16x9,
      });

      toast({
        title: "Karaoke import started",
        description: song.title,
        image: song.image,
      });

      if (location.pathname !== "/player") {
        navigate("/player");

        setTimeout(() => {
          setTab("jobs");
        }, 500);
      } else {
        setTab("jobs");
      }

      onOpenChange(false);
    } catch (e) {
      if (e instanceof Error) {
        toast({
          variant: "destructive",
          title: "Karaoke creation failed",
          description: e.message,
        });
        report.error(e);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialogs.import_karaoke.title")}</DialogTitle>
          <DialogDescription>
            {t("dialogs.import_karaoke.description")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="audioSource"
              render={({ field }) => (
                <FormItem>
                  <FormControl className="z-10">
                    <InputAudioSource
                      value={field.value}
                      onChange={field.onChange}
                      withAudio
                      withVideo
                      withKarafun
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Title")}</FormLabel>
                  <FormControl>
                    <Input type="text" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Accordion type="single" collapsible>
              <AccordionItem value="subtitlesSource">
                <AccordionTrigger>{t("Subtitles")}</AccordionTrigger>
                <AccordionContent>
                  <FormField
                    control={form.control}
                    name="subtitlesSource"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <InputSubtitlesSource
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="videoSource">
                <AccordionTrigger>{t("Video")}</AccordionTrigger>
                <AccordionContent>
                  <FormField
                    control={form.control}
                    name="videoSource"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <InputVideoSource
                            withAspectRatio
                            withAuto
                            value={field.value}
                            onChange={field.onChange}
                            setAsDefault={setDefaultVideoSource}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="thumbnailSource">
                <AccordionTrigger>{t("Thumbnail")}</AccordionTrigger>
                <AccordionContent>
                  <FormField
                    control={form.control}
                    name="thumbnailSource"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <InputThumbnailSource
                            value={field.value}
                            onChange={field.onChange}
                            setAsDefault={setDefaultThumbnailSource}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <FormField
              control={form.control}
              name="copyright"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <InputCopyright
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t("Cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {t("Import")}
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
}

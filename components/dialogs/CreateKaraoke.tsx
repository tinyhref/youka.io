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
import { useDebounce } from "@uidotdev/usehooks";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import * as gt from "@/lib/google-translate";
import { usePlayerStore } from "@/stores/player";
import { useToast } from "@/components/ui/use-toast";
import { ISongPreview } from "@/types";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import * as report from "@/lib/report";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { LyricsLangSelect } from "../LyricsLangSelect";
import { useSettingsStore } from "@/stores/settings";
import { EnableYoutube } from "./EnableYoutube";
import InputLyrics from "../InputLyrics";
import {
  getJPEGImageFileURL,
  initSongDir,
  isAudioExt,
  isVideoExt,
} from "@/lib/library";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { CreditPreview } from "../CreditPreview";
import {
  audioSourceSchema,
  thumbnailSourceSchema,
  videoSourceSchema,
} from "@/schemas";
import InputVideoSource from "../InputVideoSource";
import InputAudioSource from "../InputAudioSource";
import InputTitle from "../InputTitle";
import {
  AspectRatio16x9,
  DEFAULT_BACKGROUND_IMAGE_URL,
  DefaultAudioSourceAudio,
  DefaultAudioSourceUrl,
  DefaultAudioSourceVideo,
  VideoOptions16x9,
} from "@/consts";
import { parseYoutubeUrl } from "@/lib/youtube";
import InputThumbnailSource from "../InputThumbnailSource";
import InputCopyright from "../InputCopyright";
const formSchema = z.object({
  title: z.string().min(1),
  lang: z.string().optional(),
  lyrics: z.string().optional(),
  videoSource: videoSourceSchema,
  thumbnailSource: thumbnailSourceSchema,
  copyright: z.boolean().refine((value) => Boolean(value), {
    message: "You must accept the music usage confirmation",
  }),
  audioSource: audioSourceSchema
    .refine(
      (source) => {
        const duration = source.duration;
        return duration <= 900;
      },
      { message: "File duration must be less than 15 minutes" }
    )
    .refine(
      (source) => {
        if (source.type === "audio") {
          return isAudioExt(source.filepath);
        }
        return true;
      },
      {
        message:
          "Invalid audio file type. Did you mean to select a video file type?",
      }
    )
    .refine(
      (source) => {
        if (source.type === "video") {
          return isVideoExt(source.filepath);
        }
        return true;
      },
      {
        message:
          "Invalid video file type. Did you mean to select an audio file type?",
      }
    )
    .refine(
      (source) => {
        if (source.type === "url") {
          return parseYoutubeUrl(source.url);
        }
        return true;
      },
      {
        message: "The URL must be a valid URL",
      }
    ),
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateKaraoke({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [
    createKaraoke,
    setTab,
    addToQueue,
    playIfEmpty,
  ] = usePlayerStore((state) => [
    state.createKaraoke,
    state.setTab,
    state.addToQueue,
    state.playIfEmpty,
  ]);
  const [
    ffmpegOptions,
    alignModel,
    splitModel,
    youtubeEnabled,
    setYoutubeEnabled,
    defaultVideoSource,
    setDefaultVideoSource,
    defaultAudioSource,
    setDefaultAudioSource,
    defaultThumbnailSource,
    setDefaultThumbnailSource,
  ] = useSettingsStore((state) => [
    state.ffmpegOptions,
    state.alignModel,
    state.splitModel,
    state.youtubeEnabled,
    state.setYoutubeEnabled,
    state.defaultVideoSource,
    state.setDefaultVideoSource,
    state.defaultAudioSource,
    state.setDefaultAudioSource,
    state.defaultThumbnailSource,
    state.setDefaultThumbnailSource,
  ]);
  const [loading, setLoading] = useState(false);

  const location = useLocation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      lyrics: "",
      lang: "",
      videoSource: defaultVideoSource,
      audioSource: defaultAudioSource,
      thumbnailSource: defaultThumbnailSource,
      copyright: false,
    },
  });

  const title = form.watch("title");
  const lyrics = form.watch("lyrics");
  const lang = form.watch("lang");
  const audioSource = form.watch("audioSource");
  const debouncedLyrics = useDebounce(lyrics, 500);

  useEffect(() => {
    if (!open) {
      form.reset({
        title: "",
        lyrics: "",
        lang: "",
        thumbnailSource: defaultThumbnailSource,
        videoSource: defaultVideoSource,
        audioSource: defaultAudioSource,
        copyright: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    async function fetchLang() {
      if (lyrics && lyrics.length > 20 && !lang) {
        const dlang = await gt.language(lyrics);
        if (dlang) {
          form.setValue("lang", dlang);
        }
      }
    }
    fetchLang();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedLyrics, lang]);

  useEffect(() => {
    form.setValue("title", audioSource.title);
    if (audioSource.type === "url") {
      setDefaultAudioSource(DefaultAudioSourceUrl);
    } else if (audioSource.type === "audio") {
      setDefaultAudioSource(DefaultAudioSourceAudio);
    } else if (audioSource.type === "video") {
      setDefaultAudioSource(DefaultAudioSourceVideo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioSource]);

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);

      let videoSource = values.videoSource;
      if (videoSource.type === "auto") {
        if (audioSource.type === "audio") {
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
        } else if (audioSource.type === "url") {
          videoSource = {
            type: "url",
            url: audioSource.url,
            id: audioSource.id,
            aspectRatio: AspectRatio16x9,
          };
        }
      }

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

      const id = audioSource.id;

      await initSongDir(id);
      const thumbnail = await getJPEGImageFileURL(id, thumbnailUrl);

      const song: ISongPreview = {
        type: "song",
        id,
        title: values.title,
        image: thumbnail,
        status: "preview",
      };

      createKaraoke({
        song,
        id,
        title: values.title,
        lang: values.lang,
        thumbnail,
        audioSource: values.audioSource,
        lyrics: values.lyrics,
        alignModel,
        splitModel,
        ffmpegOptions,
        videoSource,
        videoOptions: VideoOptions16x9,
      });

      toast({
        title: "Karaoke creation started",
        description: song.title,
        image: song.image,
      });

      setTimeout(() => {
        setTab("jobs");
      }, 500);

      onOpenChange(false);

      if (location.pathname === "/player") {
        const qsong = addToQueue(song);
        playIfEmpty(qsong.id, qsong.qid);
      } else {
        navigate(`/player?sid=${id}`);
      }
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

  if (audioSource.type === "url" && open && !youtubeEnabled) {
    return (
      <EnableYoutube
        onAccept={() => {
          setYoutubeEnabled(true);
        }}
        onCancel={() => {
          onOpenChange(false);
        }}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Create Karaoke")}</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="space-y-4 p-2">
              <div className="flex flex-col gap-4">
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
                          withUrl
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
                        <InputTitle
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Accordion type="single" collapsible>
                <AccordionItem value="lyrics">
                  <AccordionTrigger>{t("Lyrics")}</AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-4">
                      <FormField
                        control={form.control}
                        name="lyrics"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <InputLyrics
                                query={title}
                                value={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        name="lang"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Language")}</FormLabel>
                            <FormControl>
                              <LyricsLangSelect
                                withTopValue
                                value={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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
                              withAuto
                              withAspectRatio
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
            </div>
            <DialogFooter className="pt-4 p-2">
              <div className="flex flex-row w-full justify-between">
                <CreditPreview />

                <div className="flex flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    {t("Cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || form.formState.isSubmitting}
                  >
                    {t("Create")}
                    {loading && (
                      <FontAwesomeIcon
                        icon={faSpinner}
                        spin={loading}
                        className="ml-2"
                      />
                    )}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

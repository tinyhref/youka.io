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

import { ISongProcessed, SongMetadata } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/stores/player";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LyricsLangSelect } from "../LyricsLangSelect";
import rollbar from "@/lib/rollbar";
import { getJPEGImageFileURL } from "@/lib/library";
import { Textarea } from "../ui/textarea";
import client from "@/lib/client";
import InputArtists from "../InputArtists";

const FormSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  image: z.string(),
  lang: z.string().min(2).max(2),
  songTitle: z.string().optional(),
  artists: z.array(z.string()).optional(),
});

interface Props {
  song: ISongProcessed;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditMetadata = ({ open, onOpenChange, song }: Props) => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });
  const setMetadata = usePlayerStore((store) => store.setMetadata);
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const refreshPlayer = usePlayerStore((store) => store.refreshPlayer);

  useEffect(() => {
    form.reset({
      title: song.title,
      lang: song.lang,
      image: song.image,
      songTitle: song.songTitle,
      artists: song.artists,
    });
  }, [form, song]);

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      setLoading(true);

      let image = data.image || song.image;
      if (data.image !== song.image) {
        image = await getJPEGImageFileURL(song.id, data.image);
      }
      const metadata: SongMetadata = {
        id: song.id,
        image,
        lang: data.lang,
        title: data.title,
        songTitle: data.songTitle,
        artists: data.artists,
      };
      await setMetadata(song.id, metadata);
      refreshPlayer();
      onOpenChange(false);
      toast({
        title: "Metadata saved successfully",
        description: song.title,
        image: song.image,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Metadata save failed",
        description: song.title,
        image: song.image,
      });
      rollbar.error(err as Error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Edit Metadata")}</DialogTitle>
        </DialogHeader>

        {process.env.NODE_ENV !== "production" && (
          <Button
            variant="outline"
            onClick={() => {
              const title = form.getValues("title");
              client.parseSongTitle(title).then((res) => {
                form.setValue("songTitle", res.title);
                form.setValue("artists", res.artists);
              });
            }}
          >
            Get Song Title
          </Button>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Title")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="songTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Song Title")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="artists"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Artists")}</FormLabel>
                  <FormControl>
                    <InputArtists
                      artists={field.value || []}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lang"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <span>{t("Lyrics Language")}</span>
                  </FormLabel>
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

            <FormField
              control={form.control}
              name="image"
              render={() => (
                <FormItem>
                  <FormLabel>
                    <span>Thumbnail</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const filepath = `file://${file.path}`;
                        form.setValue("image", filepath);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
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

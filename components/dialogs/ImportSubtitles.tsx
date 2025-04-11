import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ISongProcessed } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/stores/player";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { readLrcFile } from "@/lib/library";
const formSchema = z.object({
  title: z.string().min(2),
  file: z.any(),
});

interface Props {
  song: ISongProcessed;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportSubtitles = ({ open, onOpenChange, song }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [importSubtitles] = usePlayerStore((state) => [state.importSubtitles]);

  const fileRef = useRef<File | undefined>();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);

      const file = fileRef.current;

      if (!file) {
        form.setError("file", {
          message: "Required",
        });
        return;
      }

      const subtitles = await readLrcFile(file.path);
      const title = values.title;
      const type = "lrc";

      importSubtitles({ song, title, type, subtitles });

      onOpenChange(false);

      toast({
        title: "Job started",
        description: song.title,
        image: song.image,
      });
    } catch (err) {
      toast({
        title: "Failed to start job",
        description: song.title,
        image: song.image,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Import Subtitles")}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="title"
              defaultValue="Imported Subtitles"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>{t("Title")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Subtitles File [.lrc]</FormLabel>
                  <FormControl>
                    <Input
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        fileRef.current = file;
                      }}
                      type="file"
                      accept=".lrc"
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
              {
                <Button disabled={loading} type="submit">
                  {t("Import")}
                  {loading && (
                    <FontAwesomeIcon
                      icon={faSpinner}
                      spin={loading}
                      className="ml-2"
                    />
                  )}
                </Button>
              }
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

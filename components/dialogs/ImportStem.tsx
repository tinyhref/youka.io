import React, { useEffect, useState } from "react";
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
import { isAudioExt } from "@/lib/library";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";

const formSchema = z.object({
  file: z.instanceof(File).refine((file) => file && isAudioExt(file.name), {
    message: "Unsupported file type",
  }),
  stemType: z.enum(["vocals", "instruments"]),
});

interface Props {
  song: ISongProcessed;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportStem = ({ open, onOpenChange, song }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [importStem] = usePlayerStore((state) => [state.importStem]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      stemType: "instruments",
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);

      const type = values.stemType;
      const filepath = values.file.path;

      importStem({ song, type, filepath });

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
          <DialogTitle>{t("Import Stem")}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="stemType"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>{t("Stem")}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      className="flex flex-row gap-4 mb-6"
                      value={field.value}
                      onValueChange={(e) => field.onChange(e)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="instruments" id="r2" />
                        <Label htmlFor="r2">{t("Instrumental")}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="vocals" id="r1" />
                        <Label htmlFor="r1">{t("Vocals")}</Label>
                      </div>
                    </RadioGroup>
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
                  <FormLabel>{t("File")}</FormLabel>
                  <FormControl>
                    <Input
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        field.onChange(file);
                      }}
                      type="file"
                      accept="audio/*"
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

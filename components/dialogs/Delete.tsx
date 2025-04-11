import React from "react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

interface Props {
  title: string;
  image: string;
  open: boolean;
  fn: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  successMessage: string;
  errorMessage: string;
}

export const Delete = ({
  open,
  title,
  image,
  fn,
  onOpenChange,
  successMessage,
  errorMessage,
}: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      await fn();
      toast({
        title: successMessage,
        description: title,
        image: image,
      });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: errorMessage,
        description: title,
        image: image,
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("Are you sure you want to delete?")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("This action cannot be undone.")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2">
          <span>{title}</span>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            {t("Cancel")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>
            {t("Delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

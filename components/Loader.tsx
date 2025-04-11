import React from "react";
import { Loader2, LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

export function Loader(props: LucideProps) {
  return <Loader2 className={cn("animate-spin", props.className)} {...props} />;
}

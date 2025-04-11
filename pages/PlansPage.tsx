import React from "react";
import Header from "@/components/Header";
import { Plans } from "@/components/Plans";
import { usePlayerStore } from "@/stores/player";

export default function PlansPage() {
  const [role] = usePlayerStore((state) => [state.role]);
  return (
    <>
      <Header showProfile showLang showNav={role !== "none"} />
      <Plans />
    </>
  );
}

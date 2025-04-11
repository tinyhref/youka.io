import React from "react";
import { Fallback } from "./Fallback";
import { Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

interface Props {
  children: React.ReactNode;
}

export function ProtectPage({ children }: Props) {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return <Fallback />;
  if (!isSignedIn) return <Navigate to="/" />;

  return <>{children}</>;
}

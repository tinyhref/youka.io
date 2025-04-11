import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { SubscriptionObject } from "@/types";

interface Metadata {
  subscription?: SubscriptionObject | undefined;
  hideSocial?: boolean;
  credits?: number;
  quantity?: number;
  provider?: "lemon" | "freekassa";
}

export const useMetadata = () => {
  const { user, isLoaded } = useUser();

  const [metadata, setMetadata] = useState<Metadata | undefined>();

  useEffect(() => {
    const metadata = user?.publicMetadata as Metadata | undefined;
    setMetadata(metadata);
  }, [user]);

  return {
    isLoaded,
    ...metadata,
  };
};

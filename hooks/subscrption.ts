import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { SubscriptionObject } from "@/types";

const useSubscription = () => {
  const { user, isLoaded } = useUser();
  const [subscription, setSubscription] = useState<
    SubscriptionObject | undefined
  >();

  useEffect(() => {
    const subscription = user?.publicMetadata?.subscription as
      | SubscriptionObject
      | undefined;
    setSubscription(subscription);
  }, [user]);

  return {
    isLoaded,
    subscription,
  };
};

export default useSubscription;

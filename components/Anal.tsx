import * as amplitude from "@amplitude/analytics-browser";
import { useEffect } from "react";
import config from "@/config";
import { useUser } from "@clerk/clerk-react";
import rollbar from "@/lib/rollbar";
import { usePlayerStore } from "@/stores/player";
import { FullStory, init as initFullStory } from "@fullstory/browser";
import getMAC from "getmac";

export function Anal() {
  const { user } = useUser();
  const [role] = usePlayerStore((state) => [state.role]);
  const mac = getMAC();

  useEffect(() => {
    if (config.amplitude) {
      amplitude.init(
        config.amplitude,
        user?.primaryEmailAddress?.emailAddress,
        {
          defaultTracking: {
            sessions: true,
            pageViews: true,
            formInteractions: false,
            fileDownloads: false,
          },
        }
      );
    }

    if (user) {
      rollbar.configure({
        payload: {
          person: {
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            mac,
          },
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.primaryEmailAddress?.emailAddress]);

  useEffect(() => {
    if (!user?.primaryEmailAddress?.emailAddress) return;

    const email = user.primaryEmailAddress.emailAddress;

    amplitude.setUserId(email);

    if (role) {
      const identifyEvent = new amplitude.Identify();
      identifyEvent.set("role", role);
      identifyEvent.set("mac", mac);
      amplitude.identify(identifyEvent);
    }

    FullStory("setIdentity", {
      uid: user.id,
      properties: {
        email,
        role,
        mac,
      },
    });
  }, [user, role, mac]);

  useEffect(() => {
    if (config.fullstory) {
      initFullStory({ orgId: config.fullstory });
    }
  }, []);

  return null;
}

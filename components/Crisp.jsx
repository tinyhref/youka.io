import { useEffect } from "react";
import { Crisp as crisp } from "crisp-sdk-web";
import { useUser } from "@clerk/clerk-react";
import { useLocation } from "react-router-dom";

export function Crisp() {
  const { user } = useUser();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/dual-player") return;
    if (!user) return;

    crisp.configure("4f96bc20-899a-40fc-a997-eb02c39ebbb2");

    if (user.emailAddresses.length > 0) {
      const email = user.emailAddresses[0].emailAddress;
      crisp.user.setEmail(email);
    }
  }, [user, location.pathname]);

  return null;
}

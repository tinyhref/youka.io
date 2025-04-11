import React from "react";
import { createRoot } from "react-dom/client";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import "./index.css";
import App from "./App";
import Debug from "debug";
import { usePlayerStore } from "./stores/player";
const debug = Debug("youka:desktop");

console.log("YOUKA_GIT_SHA", process.env.REACT_APP_GIT_SHA);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

function onUpdate(r: ServiceWorkerRegistration) {
  debug("service worker on update state", r);
  if (r && r.waiting) {
    debug("skip waiting");
    r.waiting.postMessage({ type: "SKIP_WAITING" });
  }

  usePlayerStore.getState().showUpdateNotification();
}

function onSuccess(r: ServiceWorkerRegistration) {
  debug("service worker on success state", r);
}

debug("register service worker");
serviceWorkerRegistration.register({ onUpdate, onSuccess });

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(<App />);

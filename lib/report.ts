import { FullStory } from "@fullstory/browser";
import rollbar from "./rollbar";

export function error(message: string | Error, props: Object = {}) {
  if (process.env.NODE_ENV === "production") {
    const playback = getPlaybackNow();
    rollbar.error(message, { ...props, playback });
  }
  console.error(message, props);
}

export function warn(message: string, props?: Object) {
  rollbar.warn(message, props);
}

export function debug(message: string, props?: Object) {
  rollbar.debug(message, props);
}

export function getPlaybackNow() {
  return FullStory("getSession", {
    format: "url.now",
  });
}

export function getPlaybackStart() {
  return FullStory("getSession");
}

import Rollbar from "rollbar";

export const rollbarConfig = {
  accessToken: "01e4d2821d24415399b8071563d5e95d",
  enabled: process.env.NODE_ENV === "production",
  captureUncaught: true,
  captureUnhandledRejections: true,
  payload: {
    environment: process.env.NODE_ENV,
    client: {
      javascript: {
        source_map_enabled: true,
        code_version: process.env.REACT_APP_GIT_SHA,
        guess_uncaught_frames: true,
      },
    },
  },
};

const rollbar = new Rollbar(rollbarConfig);

export default rollbar;

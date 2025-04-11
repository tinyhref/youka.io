import { platform, arch } from "./os";
import Binary from ".";
import config from "./config";

const options = {
  bins: [
    {
      name: "soundstretch",
      supported: () => platform === "win32",
      url: `${config.baseUrl}/soundstretch-win32-x64.zip`,
      hash: "pE36Wd9NA9jPNEi7FSI38db9ktc=",
      main: "soundstretch.exe",
    },
    {
      name: "soundstretch",
      supported: () =>
        platform === "darwin" && (arch === "x64" || arch === "arm64"),
      url: `${config.baseUrl}/soundstretch-darwin-x64.zip`,
      hash: "xLn1t08gm1V1EbHGp8nQmVRYmW8=",
      main: "soundstretch",
    },
  ],
};

const soundstretch = new Binary(options);

export default soundstretch;

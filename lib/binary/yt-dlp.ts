import fs from "fs";
import path from "path";
import Binary from ".";
import got from "got";
import config from "./config";
import ffmpeg from "./ffmpeg";
import { platform, arch } from "./os";

const env = Object.assign({}, process.env);
env.PATH = [ffmpeg.dirpath].join(path.delimiter);

const options = {
  bins: [
    {
      name: "yt-dlp",
      supported: () => platform === "win32" && arch === "ia32",
      url: `${config.baseUrl}/yt-dlp-win32-ia32.zip`,
      main: "yt-dlp.exe",
    },
    {
      name: "yt-dlp",
      supported: () => platform === "win32" && arch === "x64",
      url: `${config.baseUrl}/yt-dlp-win32-x64.zip`,
      main: "yt-dlp.exe",
    },
    {
      name: "yt-dlp",
      supported: () =>
        platform === "darwin" && (arch === "x64" || arch === "arm64"),
      url: `${config.baseUrl}/yt-dlp-darwin-x64.zip`,
      main: "yt-dlp",
    },
    {
      name: "yt-dlp",
      supported: () => platform === "linux" && arch === "x64",
      url: `${config.baseUrl}/yt-dlp-linux-x64.zip`,
      main: "yt-dlp",
    },
  ],
};

class Ytdlp extends Binary {
  retry = 0;

  async install() {
    await super.install();
    setTimeout(() => {
      this.update();
    }, 100);
  }

  async update() {
    try {
      await this.updateAutomatically();
    } catch (e) {
      await this.updateManually();
    }
  }

  async updateAutomatically() {
    const { stdout } = await this.exec(["-U", "-v", "--no-check-certificate"]);
    console.log(stdout);
  }

  async updateManually() {
    const urls: Record<string, string> = {
      win32:
        "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe",
      darwin:
        "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos",
      linux: "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp",
    };

    const url = urls[platform];
    if (!url) {
      throw new Error("unsupported platform", { platform } as any);
    }

    const response = got(url);
    const buffer = await response.buffer();

    await fs.promises.writeFile(this.mainpath, buffer, { encoding: "binary" });

    if (["darwin", "linux"].includes(platform)) {
      await fs.promises.chmod(this.mainpath, "755");
    }
  }
}

const ytDlp = new Ytdlp(options);

export default ytDlp;

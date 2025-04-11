import { execa } from "execa";
import { platform, arch } from "./os";
import Binary from ".";
import config from "./config";
import ffprobe from "./ffprobe";
import * as report from "@/lib/report";
import { FFmpegProgress, ProgressFunc } from "@/types";
import { splitStringToChunks } from "../utils";

const options = {
  bins: [
    {
      name: "ffmpeg",
      supported: () => platform === "win32" && arch === "ia32",
      url: `${config.baseUrl}/ffmpeg-win32-ia32.zip`,
      hash: "7HqSDC/6J6o8lpBU5e0KgZhZRBg=",
      main: "ffmpeg.exe",
    },
    {
      name: "ffmpeg",
      supported: () => platform === "win32" && arch === "x64",
      url: `${config.baseUrl}/ffmpeg-7-win32-x64.zip`,
      hash: "Y3vckGlFmS0iFpv0vNTEx725hmk=",
      main: "ffmpeg.exe",
    },
    {
      name: "ffmpeg",
      supported: () =>
        platform === "darwin" && (arch === "x64" || arch === "arm64"),
      url: `${config.baseUrl}/ffmpeg-7-darwin-x64.zip`,
      hash: "R9xdyYY3T5r1SPZm85dqadZbba8=",
      main: "ffmpeg",
    },
    {
      name: "ffmpeg",
      supported: () => platform === "linux" && arch === "ia32",
      url: `${config.baseUrl}/ffmpeg-linux-ia32.zip`,
      hash: "kIjIJjMQ/Z8XstYFISIJPKxtUg4=",
      main: "ffmpeg",
    },
    {
      name: "ffmpeg",
      supported: () => platform === "linux" && arch === "x64",
      url: `${config.baseUrl}/ffmpeg-7-linux-x64.zip`,
      hash: "OSRn4FzfxtiFpE+xG6r/lUYVrtE=",
      main: "ffmpeg",
    },
  ],
};

function timemarkToSeconds(timemark: string | number) {
  if (typeof timemark === "number") {
    return timemark;
  }

  if (timemark.indexOf(":") === -1 && timemark.indexOf(".") >= 0) {
    return Number(timemark);
  }

  var parts = timemark.split(":");

  // add seconds
  var secs = Number(parts.pop());

  if (parts.length) {
    // add minutes
    secs += Number(parts.pop()) * 60;
  }

  if (parts.length) {
    // add hours
    secs += Number(parts.pop()) * 3600;
  }

  return secs;
}

function parseProgressLine(line: string) {
  var progress: Record<string, string> = {};

  // Remove all spaces after = and trim
  line = line.replace(/=\s+/g, "=").trim();
  var progressParts = line.split(" ");

  // Split every progress part by "=" to get key and value
  for (var i = 0; i < progressParts.length; i++) {
    var progressSplit = progressParts[i].split("=", 2);
    var key = progressSplit[0];
    var value = progressSplit[1];

    // This is not a progress line
    if (typeof value === "undefined") return null;

    progress[key] = value;
  }

  return progress;
}

function parseProgress(
  stderrLine: string,
  duration?: number
): FFmpegProgress | undefined {
  var progress = parseProgressLine(stderrLine);

  if (progress) {
    return {
      frames: parseInt(progress.frame, 10),
      currentFps: parseInt(progress.fps, 10),
      currentKbps: progress.bitrate
        ? parseFloat(progress.bitrate.replace("kbits/s", ""))
        : 0,
      targetSize: parseInt(progress.size || progress.Lsize, 10),
      timemark: progress.time,
      percent: duration
        ? Math.trunc((timemarkToSeconds(progress.time) / duration) * 100)
        : undefined,
    };
  }
}

class FFmpeg extends Binary {
  async exec(
    args?: string[],
    opts?: any,
    onProgress?: ProgressFunc,
    duration?: number
  ) {
    const subprocess = execa(this.mainpath, args, opts);

    if (onProgress) {
      if (duration === undefined && args) {
        try {
          const input = args[args.indexOf("-i") + 1];
          try {
            duration = await ffprobe.duration(input, opts);
          } catch {}
        } catch (e) {
          report.error(e as any);
        }
      }

      subprocess.stderr?.on("data", (data: Buffer) => {
        const progress = parseProgress(data.toString(), duration);
        if (
          progress &&
          progress.percent !== undefined &&
          !Number.isNaN(progress.percent)
        ) {
          if (progress.percent > 100) return;
          onProgress(progress.percent);
        }
      });
    }

    try {
      await subprocess;
      return subprocess;
    } catch (e) {
      const message = (e as Error).message;
      if (!message.includes("Command was canceled")) {
        const messages = splitStringToChunks((e as Error).message, 500);
        report.debug("ffmpeg output", { messages });
      }

      throw e;
    }
  }
}

const ffmpeg = new FFmpeg(options);

export default ffmpeg;

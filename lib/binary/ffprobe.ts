import Binary from ".";
import * as report from "@/lib/report";
import config from "./config";
import { platform, arch } from "./os";
import rollbar from "../rollbar";
import { getSafeFilepath } from "../library";

export interface Stream {
  index: number;
  codecType: "video" | "audio";
  codecName: string;
  duration: number;
  avgFrameRate?: number;
}

const options = {
  bins: [
    {
      name: "ffprobe",
      supported: () => platform === "win32" && arch === "ia32",
      url: `${config.baseUrl}/ffprobe-win32-ia32.zip`,
      hash: "6uyfwx2MsPjZ8FJcy0Ue5BoG24M=",
      main: "ffprobe.exe",
    },
    {
      name: "ffprobe",
      supported: () => platform === "win32" && arch === "x64",
      url: `${config.baseUrl}/ffprobe-7-win32-x64.zip`,
      hash: "rs+7UVlHM4uCH7QBrX/20V/zH7I=",
      main: "ffprobe.exe",
    },
    {
      name: "ffprobe",
      supported: () =>
        platform === "darwin" && (arch === "x64" || arch === "arm64"),
      url: `${config.baseUrl}/ffprobe-7-darwin-x64.zip`,
      hash: "nzkI9Q8eF+zqyhizCpK9fvrEqLo=",
      main: "ffprobe",
    },
    {
      name: "ffprobe",
      supported: () => platform === "linux" && arch === "ia32",
      url: `${config.baseUrl}/ffprobe-linux-ia32.zip`,
      hash: "M59Bh3D4pCivqnJOm6r1K3w8oZ8=",
      main: "ffprobe",
    },
    {
      name: "ffprobe",
      supported: () => platform === "linux" && arch === "x64",
      url: `${config.baseUrl}/ffprobe-7-linux-x64.zip`,
      hash: "/5DbalbQRdor67ozG4kkxLzrAVo=",
      main: "ffprobe",
    },
  ],
};

class FFprobe extends Binary {
  async info(input: string, opts?: any): Promise<any> {
    const args = [
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
    ];
    let p;
    try {
      p = await this.exec([...args, input], opts);
      return JSON.parse(p.stdout.toString());
    } catch (e) {
      try {
        const safeInput = await getSafeFilepath(input);
        p = await this.exec([...args, safeInput], opts);
        return JSON.parse(p.stdout.toString());
      } catch (e) {
        report.error("failed to get ffprobe info", { e, p });
      }
    }
  }

  async duration(input: string, opts?: any): Promise<number> {
    const info = await this.info(input, opts);
    if (!info?.format?.duration) {
      throw new Error("failed to get duration");
    }
    return parseFloat(info.format.duration);
  }

  async resolution(
    input: string,
    opts?: any
  ): Promise<{ width: number; height: number } | undefined> {
    const info = await this.info(input, opts);
    if (!info?.streams?.[0]) {
      rollbar.warn("no stream found", { info });
      return undefined;
    }
    const width = parseInt(info.streams[0].width);
    const height = parseInt(info.streams[0].height);
    if (width && height) {
      return { width, height };
    }

    rollbar.warn("failed to get resolution", { info });

    return undefined;
  }

  async bitrate(input: string, opts?: any): Promise<number | undefined> {
    const info = await this.info(input, opts);
    return info?.format?.bit_rate ? parseInt(info.format.bit_rate) : undefined;
  }

  async streams(input: string, opts?: any): Promise<Stream[] | undefined> {
    const info = await this.info(input, opts);
    if (!info || !info.streams) {
      return undefined;
    }

    return info.streams.map((stream: any) => ({
      index: stream.index,
      codecType: stream.codec_type,
      codecName: stream.codec_name,
      duration: parseFloat(stream.duration),
      avgFrameRate: stream.avg_frame_rate,
    }));
  }
}

export function parseFrameRate(frameRate: string): number | undefined {
  if (!frameRate) return undefined;

  const parts = frameRate.split("/").map(Number);
  if (
    parts.length !== 2 ||
    isNaN(parts[0]) ||
    isNaN(parts[1]) ||
    parts[1] === 0
  ) {
    return undefined;
  }

  const [numerator, denominator] = parts;
  return numerator / denominator;
}

const ffprobe = new FFprobe(options);

export default ffprobe;

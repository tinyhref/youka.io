import fs from "fs";
import { platform, arch } from "./os";
import Binary from ".";
import config from "./config";
import { tmpName } from "tmp-promise";
import { z } from "zod";

const options = {
  bins: [
    {
      name: "audiowaveform",
      supported: () => platform === "win32" && arch === "x64",
      url: `${config.baseUrl}/audiowaveform-win32-x64.zip`,
      hash: "D2Xb4dCom5T/0U2i0G0/QX0URBk=",
      main: "audiowaveform.exe",
    },
    {
      name: "audiowaveform",
      supported: () => platform === "win32" && arch === "ia32",
      url: `${config.baseUrl}/audiowaveform-win32-ia32.zip`,
      hash: "VURFk3xwZKH8qTWgOaVhJMWSOcE=",
      main: "audiowaveform.exe",
    },
  ],
};

const PeaksSchema = z.object({
  version: z.number(),
  channels: z.number(),
  sample_rate: z.number(),
  samples_per_pixel: z.number(),
  bits: z.number(),
  length: z.number(),
  data: z.array(z.number()),
});
type Peaks = z.infer<typeof PeaksSchema>;

export interface PeaksOptions {
  zoom?: number;
  bits?: number;
}

class AudioWaveform extends Binary {
  async peaks(input: string, options?: PeaksOptions): Promise<Peaks> {
    const output = await tmpName({ postfix: ".json" });

    const bits = options?.bits || 16;
    const zoom = options?.zoom || 256;

    await this.exec([
      "-i",
      input,
      "-o",
      output,
      "-z",
      zoom.toString(),
      "-b",
      bits.toString(),
    ]);
    const res = await fs.promises.readFile(output, "utf8");
    const peaks = PeaksSchema.parse(JSON.parse(res));
    try {
      await fs.promises.unlink(output);
    } catch (e) {
      console.error(e);
    }
    return peaks;
  }
}

const audiowaveform = new AudioWaveform(options);

export default audiowaveform;

import { asyncRead } from "./utils";
import { KfnDirectory, KfnData, IKfnFileReader } from "./types";

export class KfnFileReader implements IKfnFileReader {
  private cursor: number;
  data: KfnData = {};

  constructor(public fileDescriptor: number, public filename?: string) {
    this.cursor = 0;
  }

  private async readNumber(size: number = 1): Promise<number> {
    const buffer: Buffer = (
      await asyncRead(this.fileDescriptor, Buffer.alloc(size), 0, size, null)
    ).buffer;
    this.cursor += size;
    return buffer.reduceRight((acc, cur) => (acc << 8) + cur, 0);
  }
  private async readString(size: number = 1): Promise<string> {
    const buffer: Buffer = (
      await asyncRead(this.fileDescriptor, Buffer.alloc(size), 0, size, null)
    ).buffer;
    this.cursor += size;
    return buffer.toString("utf8");
  }

  async readFile(size: number, offset: number): Promise<Buffer> {
    return (
      await asyncRead(
        this.fileDescriptor,
        Buffer.alloc(size),
        0,
        size,
        offset + this.cursor
      )
    ).buffer;
  }

  async buildHeaders(): Promise<void> {
    if (this.cursor === 0 && "KFNB" !== (await this.readString(4)))
      throw new Error("file.bad.signature");
    this.data.headers = {};
    let key: string = "";
    do {
      key = await this.readString(4);
      const type: number = await this.readNumber(1);
      let value: string | number;
      if (type === 1) {
        // integer
        value = await this.readNumber(4);
      } else {
        // string
        const length: number = await this.readNumber(4);
        value = await this.readString(length);
      }
      // console.log(`@index ${this.cursor} ${key} @type: ${type} -> '${value}'`);
      this.data.headers[key] = value;
    } while (key.length === 4 && key !== "ENDH");
  }

  async buildDirectory(): Promise<void> {
    if (!this.data.headers) {
      await this.buildHeaders();
    }
    if (!this.data.directory) {
      const resp: KfnDirectory = { files: [] };
      let fileCount: number = await this.readNumber(4);
      for (let i = 0; i < fileCount; i++) {
        resp.files.push({
          name: await this.readString(await this.readNumber(4)),
          type: await this.readNumber(4),
          length1: await this.readNumber(4),
          offset: await this.readNumber(4),
          length2: await this.readNumber(4),
          flags: await this.readNumber(4),
        });
      }
      resp.offset = this.cursor;
      this.data.directory = resp;
    }
  }
}

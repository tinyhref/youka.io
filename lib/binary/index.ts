import EventEmitter from "events";
import fs from "fs";
import os from "os";
import path from "path";
import got from "got";
import tmp from "tmp-promise";
import extract from "extract-zip";
import { execa } from "execa";
import { hashElement } from "folder-hash";
import { BINARIES_PATH, TMP_PATH } from "../path";
import { exists } from "../utils";
import { platform } from "./os";
import Debug from "debug";
import * as report from "@/lib/report";

const debug = Debug("youka:desktop");

interface BinaryOptions {
  name: string;
  supported: () => boolean;
  url: string;
  hash?: string;
  main?: string;
}

interface Options {
  bins: BinaryOptions[];
  rootpath?: string;
  tmppath?: string;
}

const hashOptions = {
  files: { exclude: [".DS_Store"] },
};

export default class Binary extends EventEmitter {
  _bin: BinaryOptions | undefined;
  _rootpath: string;
  _tmppath: string;

  constructor(options: Options) {
    super();
    this._rootpath = options.rootpath || BINARIES_PATH;
    this._tmppath = options.tmppath || os.tmpdir();

    this._bin = options.bins.find((o) => o.supported());
  }

  supported(): boolean {
    return this._bin !== undefined;
  }

  async uninstall() {
    if (!this._bin) {
      return;
    }
    try {
      await fs.promises.rmdir(this.dirpath, { recursive: true });
    } catch (e) {
      console.error(e);
      report.error("failed to uninstall binary", e as any);
    }
  }

  async reinstall() {
    await this.uninstall();
    await this.install();
  }

  async install() {
    if (!this._bin) {
      return;
    }

    let ex = await exists(this.dirpath);
    if (ex && this._bin.hash) {
      const hash = await hashElement(this.dirpath, hashOptions);
      ex = hash.hash === this._bin.hash;
      if (!ex) debug("hash", this._bin.name, hash.hash);
    } else if (ex && this._bin.main) {
      ex = await exists(this.mainpath);
    }
    if (ex) {
      this.emit("progress", {
        total: 1,
        transferred: 1,
      });
      return;
    }

    try {
      await fs.promises.rmdir(this.dirpath, { recursive: true });
    } catch (e) {
      console.error(e);
    }
    let buffer;
    const g = got(this._bin.url);
    g.on("downloadProgress", (p) => {
      this.emit("progress", p);
    });
    buffer = await g.buffer();
    const zipfile = await tmp.file({ dir: TMP_PATH });
    await fs.promises.writeFile(zipfile.path, buffer, { encoding: "binary" });
    await extract(zipfile.path, { dir: this._rootpath });
    await zipfile.cleanup();

    if (this._bin.main && ["darwin", "linux"].includes(platform)) {
      await fs.promises.chmod(this.mainpath, "755");
    }
  }

  async exec(args?: string[], opts?: any) {
    if (!this._bin) {
      throw new Error("Binary not supported");
    }
    return execa(this.mainpath, args, opts);
  }

  get main() {
    if (!this._bin || !this._bin.main) return "";
    return this._bin.main;
  }

  get mainpath() {
    if (!this._bin || !this._bin.main) return "";
    return path.join(this._rootpath, this._bin.name, this._bin.main);
  }

  get dirpath() {
    if (!this._bin) return "";
    return path.join(this._rootpath, this._bin.name);
  }
}

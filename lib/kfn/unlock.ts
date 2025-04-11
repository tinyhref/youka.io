import * as crypto from "crypto";
import * as ini from "ini";

enum KFNSubfileType {
  SONG = 1,
  AUDIO = 2,
  IMAGE = 3,
  FONT = 4,
  VIDEO = 5,
  MILKDROP = 6,
  CDG = 7,
}

// 1 = vertical text
// 2 = classic karaoke
// 21 = sprites
// 51 = background
// 53 = Milkdrop
// 61 = CDG
// 62 = video
// const VALID_EFFECT_IDS = new Set([1, 2, 21, 51, 53, 61, 62]);

class KFNSubfile {
  name: Buffer;
  ftype: KFNSubfileType;
  data: Buffer;
  length: number;
  isEncrypted: boolean;

  constructor(
    name: Buffer,
    ftype: KFNSubfileType,
    data: Buffer,
    length: number,
    isEncrypted: boolean
  ) {
    this.name = name;
    this.ftype = ftype;
    this.data = data;
    this.length = length;
    this.isEncrypted = isEncrypted;
  }
}

export class KFNFile {
  headers: { [key: string]: number | Buffer } = {};
  subfiles: KFNSubfile[] = [];
}

export function readKFN(fileBuffer: Buffer): KFNFile {
  let offset = 0;
  const kfn = new KFNFile();

  // Read file signature
  const magic = fileBuffer.slice(offset, offset + 4);
  offset += 4;
  if (magic.toString("ascii") !== "KFNB") {
    throw new Error("unexpected file signature");
  }

  // Read headers
  while (true) {
    const header = fileBuffer.slice(offset, offset + 4).toString("ascii");
    offset += 4;
    const flag = fileBuffer.readUInt8(offset);
    offset += 1;

    let value: number | Buffer;
    if (flag === 1) {
      // Single number
      value = fileBuffer.readUInt32LE(offset);
      offset += 4;
    } else if (flag === 2) {
      // String with length
      const length = fileBuffer.readUInt32LE(offset);
      offset += 4;
      value = fileBuffer.slice(offset, offset + length);
      offset += length;
    } else {
      throw new Error(`unexpected flag for header ${header}: ${flag}`);
    }

    // If ENDH header is reached, stop processing headers
    if (header === "ENDH") {
      break;
    }

    kfn.headers[header] = value;
  }

  // Read subfile metadata
  const subfileInfos: {
    name: Buffer;
    ftype: number;
    length: number;
    offset: number;
    encryptedLength: number;
    isEncrypted: number;
  }[] = [];

  const subfileCount = fileBuffer.readUInt32LE(offset);
  offset += 4;

  for (let i = 0; i < subfileCount; i++) {
    const subfileNameLength = fileBuffer.readUInt32LE(offset);
    offset += 4;
    const subfileName = fileBuffer.slice(offset, offset + subfileNameLength);
    offset += subfileNameLength;

    const ftype = fileBuffer.readUInt32LE(offset);
    offset += 4;
    const length = fileBuffer.readUInt32LE(offset);
    offset += 4;
    const dataOffset = fileBuffer.readUInt32LE(offset);
    offset += 4;
    const encryptedLength = fileBuffer.readUInt32LE(offset);
    offset += 4;
    const isEncrypted = fileBuffer.readUInt32LE(offset);
    offset += 4;

    subfileInfos.push({
      name: subfileName,
      ftype,
      length,
      offset: dataOffset,
      encryptedLength,
      isEncrypted,
    });
  }

  // Read subfile data
  const subfilesStart = offset;
  for (const info of subfileInfos) {
    const subfileDataOffset = subfilesStart + info.offset;
    const data = fileBuffer.slice(
      subfileDataOffset,
      subfileDataOffset + info.encryptedLength
    );

    const subfile = new KFNSubfile(
      info.name,
      info.ftype,
      data,
      info.length,
      !!info.isEncrypted
    );
    kfn.subfiles.push(subfile);
  }

  return kfn;
}

export function writeKFN(kfn: KFNFile): Buffer {
  const parts: Buffer[] = [];

  // Write file signature
  parts.push(Buffer.from("KFNB", "ascii"));

  // Write headers
  for (const header in kfn.headers) {
    parts.push(Buffer.from(header, "ascii"));

    const data = kfn.headers[header];
    if (typeof data === "number") {
      // Flag = 1
      parts.push(Buffer.from([0x01]));
      const buf = Buffer.alloc(4);
      buf.writeUInt32LE(data, 0);
      parts.push(buf);
    } else {
      // Flag = 2
      parts.push(Buffer.from([0x02]));
      const buf = Buffer.alloc(4);
      buf.writeUInt32LE(data.length, 0);
      parts.push(buf);
      parts.push(data);
    }
  }

  // Write ENDH header
  parts.push(Buffer.from("ENDH", "ascii"));
  parts.push(Buffer.from([0x01]));
  const endhValue = Buffer.alloc(4);
  endhValue.writeUInt32LE(0xffffffff, 0);
  parts.push(endhValue);

  // Write subfile metadata
  const subfileCountBuf = Buffer.alloc(4);
  subfileCountBuf.writeUInt32LE(kfn.subfiles.length, 0);
  parts.push(subfileCountBuf);

  let offset = 0;
  for (const subfile of kfn.subfiles) {
    // Name length + name
    const nameLengthBuf = Buffer.alloc(4);
    nameLengthBuf.writeUInt32LE(subfile.name.length, 0);
    parts.push(nameLengthBuf);
    parts.push(subfile.name);

    // File type
    const ftypeBuf = Buffer.alloc(4);
    ftypeBuf.writeUInt32LE(subfile.ftype, 0);
    parts.push(ftypeBuf);

    // Unencrypted data length
    const lengthBuf = Buffer.alloc(4);
    lengthBuf.writeUInt32LE(subfile.length, 0);
    parts.push(lengthBuf);

    // Offset of data (relative to start of subfile data)
    const offsetBuf = Buffer.alloc(4);
    offsetBuf.writeUInt32LE(offset, 0);
    parts.push(offsetBuf);

    // Encrypted data length
    const encryptedLengthBuf = Buffer.alloc(4);
    encryptedLengthBuf.writeUInt32LE(subfile.data.length, 0);
    parts.push(encryptedLengthBuf);

    // Is this file encrypted?
    const isEncryptedBuf = Buffer.alloc(4);
    isEncryptedBuf.writeUInt32LE(subfile.isEncrypted ? 1 : 0, 0);
    parts.push(isEncryptedBuf);

    // Increase offset
    offset += subfile.data.length;
  }

  // Write subfile data
  for (const subfile of kfn.subfiles) {
    parts.push(subfile.data);
  }

  return Buffer.concat(parts);
}

export function unlockKFN(kfn: KFNFile): KFNFile {
  const allZeroes = Buffer.alloc(16);

  if (
    kfn.headers["FLID"] &&
    Buffer.isBuffer(kfn.headers["FLID"]) &&
    !kfn.headers["FLID"].equals(allZeroes)
  ) {
    // Create decryptor
    const decipher = crypto.createDecipheriv(
      "aes-128-ecb",
      kfn.headers["FLID"] as Buffer,
      null
    );
    // Disable automatic padding
    (decipher as any).setAutoPadding(false);

    // Zero out the encryption key
    kfn.headers["FLID"] = allZeroes;

    // Decrypt encrypted subfiles
    for (const subfile of kfn.subfiles) {
      // Skip unencrypted subfiles
      if (!subfile.isEncrypted) {
        continue;
      }

      const decrypted = Buffer.concat([
        decipher.update(subfile.data),
        decipher.final(),
      ]);
      subfile.data = decrypted.slice(0, subfile.length);
      subfile.isEncrypted = false;
    }
  }

  // Step 2: Change the publishing rights
  if ("RGHT" in kfn.headers) {
    kfn.headers["RGHT"] = 0;
  }

  // Step 3: Remove invalid effects
  for (const subfile of kfn.subfiles) {
    // Skip all files except for song config files
    if (subfile.ftype !== KFNSubfileType.SONG) {
      continue;
    }

    // Parse song config
    const configString = subfile.data.toString("latin1");
    const config = ini.parse(configString);

    // for (const section in config) {
    //   if (!section.toLowerCase().startsWith("eff")) {
    //     continue;
    //   }

    //   const effectId = parseInt(config[section]["id"], 10);
    //   console.log("effectId", effectId);
    //   if (VALID_EFFECT_IDS.has(effectId)) {
    //     continue;
    //   }

    //   // Delete this section
    //   delete config[section];
    // }

    // Write back new song config
    const newConfigString = ini.encode(config);
    subfile.data = Buffer.from(newConfigString, "latin1");
    subfile.length = subfile.data.length;
  }

  return kfn;
}

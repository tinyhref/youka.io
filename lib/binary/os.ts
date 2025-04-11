import os from "os";

export const platform = os.platform();
export const arch = os.arch();
export const release = os.release();
export const major = os.release().split(".").length
  ? parseInt(os.release().split(".")[0])
  : -1;

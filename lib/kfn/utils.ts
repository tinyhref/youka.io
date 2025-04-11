import { promisify } from "util";
import { exists, readFile, writeFile, open, read, close } from "fs";

const passThroughFunction = (fn: any, args: any) => {
  if (!Array.isArray(args)) args = [args];
  return promisify(fn)(...args);
};

export const asyncExists = (file: string) => passThroughFunction(exists, file);
export const asyncReadFile = (...args: any) =>
  passThroughFunction(readFile, args);
export const asyncWriteFile = (...args: any) =>
  passThroughFunction(writeFile, args);
export const asyncOpen = (...args: any) => passThroughFunction(open, args);
export const asyncRead = (...args: any) => passThroughFunction(read, args);
export const asyncClose = (...args: any) => passThroughFunction(close, args);

export function clone(a: any) {
  return JSON.parse(JSON.stringify(a));
}

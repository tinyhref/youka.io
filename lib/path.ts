import path from "path";
import Debug from "debug";
import { ISettingsState, useSettingsStore } from "@/stores/settings";

const debug = Debug("youka:desktop");
const join = path.join;

let ROOT_PATH = "";
let LIBRARY_PATH = "";
let DOWNLOAD_PATH = "";
let BINARIES_PATH = "";
let FONTS_PATH = "";
let CACHE_PATH = "";
let TMP_PATH = "";
let DB_PATH = "";

updatePaths(useSettingsStore.getState());

debug("ROOT_PATH", ROOT_PATH);

useSettingsStore.subscribe((state) => {
  updatePaths(state);
});

function updatePaths(state: ISettingsState) {
  ROOT_PATH = state.rootPath;
  BINARIES_PATH = join(state.rootPath, "binaries");
  FONTS_PATH = join(state.rootPath, "fonts");
  CACHE_PATH = join(state.rootPath, "cache");
  TMP_PATH = join(state.rootPath, "tmp");
  DB_PATH = join(state.rootPath, "db.json");

  LIBRARY_PATH = state.libraryPath;
  DOWNLOAD_PATH = state.exportPath;
}

export {
  LIBRARY_PATH,
  DOWNLOAD_PATH,
  ROOT_PATH,
  BINARIES_PATH,
  FONTS_PATH,
  CACHE_PATH,
  TMP_PATH,
  DB_PATH,
};

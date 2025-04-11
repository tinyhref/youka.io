import { LyricsProvider } from "..";

// import shazam from "./shazam";
import musixmatch from "./musixmatch";
import genius from "./genius";
import smule from "./smule";
import azlyrics from "./azlyrics";
import buscaletras from "./buscaletras";
import cmtv from "./cmtv";
import gasazip from "./gasazip";
import kapook from "./kapook";
import lyrics from "./lyrics";
import lyricsmint from "./lyricsmint";
import mojim from "./mojim";
import musica from "./musica";
import sanook from "./sanook";
import utamap from "./utamap";
import utanet from "./utanet";
import sarkisozum from "./sarkisozum";
import karaokeru from "./karaoke-ru";
import russongs from "./rus-songs";
import kkbox from "./kkbox";
import shironet from "./shironet";

const providers: LyricsProvider[] = [
  // shazam,
  musixmatch,
  genius,
  smule,
  azlyrics,
  buscaletras,
  cmtv,
  gasazip,
  kapook,
  lyrics,
  lyricsmint,
  mojim,
  musica,
  sanook,
  utamap,
  utanet,
  sarkisozum,
  karaokeru,
  russongs,
  kkbox,
  shironet,
];

export default providers;

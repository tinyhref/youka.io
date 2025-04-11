import { EventEmitter } from "events";
import { IKaraokeLoadInput, IPlayerController } from "@/types";
import VideoPlayer from "./video";
import SpPlayer from "./sp";
import { safeFileUrl } from "@/lib/library";

export default class KaraokePlayer extends EventEmitter
  implements IPlayerController {
  private videoPlayer: VideoPlayer;
  private vocalsPlayer: SpPlayer;
  private noVocalsPlayer: SpPlayer;
  private players: IPlayerController[];

  constructor() {
    super();

    this.videoPlayer = new VideoPlayer();
    this.vocalsPlayer = new SpPlayer();
    this.noVocalsPlayer = new SpPlayer();

    this.players = [this.vocalsPlayer, this.noVocalsPlayer, this.videoPlayer];

    this.noVocalsPlayer.on("timeupdate", (time) => {
      this.emit("timeupdate", time);
      const diff = Math.abs(this.videoPlayer.element.currentTime - time);
      if (diff > 0.1) {
        this.videoPlayer.time = time;
      }
    });
    this.videoPlayer.on("durationchange", (duration) =>
      this.emit("durationchange", duration)
    );
    this.videoPlayer.on("ended", () => this.emit("ended"));
    this.videoPlayer.on("seeking", () => this.emit("seeking"));
    this.videoPlayer.on("seeked", () => this.emit("seeked"));

    this.noVocalsPlayer.on("playing", () => this.emit("playing"));
    this.noVocalsPlayer.on("pause", () => this.emit("pause"));
  }

  async init(options?: any) {
    await Promise.all(this.players.map((player) => player.init(options)));
  }

  whenAllEmittersEmit(
    emitters: EventEmitter[],
    eventName: string,
    callback: Function
  ) {
    let count = 0;
    const targetCount = emitters.length;

    emitters.forEach((emitter) => {
      emitter.on(eventName, () => {
        count++;
        if (count === targetCount) {
          count = 0;
          callback();
        }
      });
    });
  }

  async load({ vocalsStem, instrumentsStem, video }: IKaraokeLoadInput) {
    const promises = [
      this.noVocalsPlayer.load(safeFileUrl(instrumentsStem.filepath)),
      this.videoPlayer.load(safeFileUrl(video.filepath)),
    ];
    if (vocalsStem) {
      promises.unshift(
        this.vocalsPlayer.load(safeFileUrl(vocalsStem.filepath))
      );
    }
    await Promise.all(promises);
  }

  async play() {
    await Promise.all(this.players.map((player) => player.play()));
  }

  pause() {
    this.players.forEach((player) => player.pause());
  }

  stop() {
    this.players.forEach((player) => player.stop());
  }

  set time(time: number) {
    this.players.forEach((player) => (player.time = time));
  }

  set pitch(pitch: number) {
    this.players.forEach((player) => (player.pitch = pitch));
  }

  set tempo(tempo: number) {
    this.players.forEach((player) => (player.tempo = tempo));
  }

  set volume(volume: number) {
    this.players.forEach((player) => (player.volume = volume));
  }

  setVocalsVolume(volume: number) {
    this.vocalsPlayer.volume = volume;
  }

  setNoVocalsVolume(volume: number) {
    this.noVocalsPlayer.volume = volume;
  }
}

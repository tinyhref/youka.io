import { EventEmitter } from "events";
import { IPlayerController } from "@/types";

export default class VideoPlayer extends EventEmitter
  implements IPlayerController {
  private _element?: HTMLVideoElement;

  get element(): HTMLVideoElement {
    if (!this._element) {
      if (process.env.NODE_ENV === "development") {
        this._element = document.createElement("video");
      } else {
        throw new Error("Video element not found");
      }
    }
    return this._element;
  }

  async init(element: HTMLVideoElement) {
    this._element = element;
    this.element.oncanplay = () => this.emit("canplay");

    this.element.onplay = () => this.emit("play");
    this.element.onpause = () => this.emit("pause");
    this.element.onended = () => this.emit("ended");
    this.element.onseeking = () => this.emit("seeking");
    this.element.onseeked = () => this.emit("seeked");
    this.element.onplaying = () => this.emit("playing");
    this.element.ondurationchange = () =>
      this.emit("durationchange", this.element?.duration);
    this.element.ontimeupdate = () =>
      this.emit("timeupdate", this.element?.currentTime);
  }

  async load(url: string) {
    this.element.pause();
    this.element.src = url;
    this.element.load();

    await new Promise((resolve) => {
      this.once("canplay", resolve);
    });
  }

  play() {
    return this.element.play();
  }

  pause() {
    this.element.pause();
  }

  stop() {
    this.element.pause();
    this.element.src = "";
    this.element.currentTime = 0;
  }

  set time(time: number) {
    this.element.currentTime = time;
  }

  set pitch(pitch: number) {}

  set tempo(tempo: number) {
    this.element.playbackRate = tempo;
  }

  set volume(volume: number) {
    this.element.volume = volume;
  }
}

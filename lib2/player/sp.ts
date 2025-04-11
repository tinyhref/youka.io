import { EventEmitter } from "events";
import { IPlayerController } from "@/types";
import { getSuperpoweredInstance } from "@/lib/sp";
import { SuperpoweredWebAudio } from "@/lib/Superpowered";

type PitchMessage = {
  action: "set-pitch";
  pitch: number;
};

type TempoMessage = {
  action: "set-tempo";
  tempo: number;
};

type PositionMessage = {
  action: "set-position";
  position: number;
};

type PlayMessage = {
  action: "play";
};

type PauseMessage = {
  action: "pause";
};

type StopMessage = {
  action: "stop";
};

type LoadMessage = {
  action: "load";
  url: string;
};

type StateMessage = {
  action: "state";
};

type PlayerMessage =
  | PitchMessage
  | TempoMessage
  | PositionMessage
  | PlayMessage
  | PauseMessage
  | StopMessage
  | LoadMessage
  | StateMessage;

type LoadedMessage = {
  action: "loaded" | "opened" | "open-failed" | "play";
};
type IncomeMessage = PlayerStateMessage | LoadedMessage;

type PlayerStateMessage = {
  action: "state";
  state: State;
};

interface State {
  opened: boolean;
  position: number;
  duration: number;
  playing: boolean;
}

interface SpAudioNode extends AudioWorkletNode {
  sendMessageToAudioScope: (message: PlayerMessage) => void;
}

export default class SpPlayer extends EventEmitter
  implements IPlayerController {
  audioNode?: SpAudioNode;
  gainNode?: GainNode;
  state: State;
  interval?: NodeJS.Timeout;

  constructor() {
    super();

    this.state = {
      opened: false,
      position: 0,
      duration: 0,
      playing: false,
    };
  }

  async init() {
    const sp = await getSuperpoweredInstance();
    const spWeb = new SuperpoweredWebAudio(44100, sp);

    if (this.interval) {
      clearInterval(this.interval);
    }

    this.interval = setInterval(() => {
      this.audioNode?.sendMessageToAudioScope({
        action: "state",
      });
    }, 100);

    if (this.audioNode) {
      this.audioNode.disconnect();
      this.audioNode = undefined;
    }

    this.audioNode = await spWeb.createAudioNodeAsync(
      "/js/processor.js",
      "MyProcessor",
      this.onMessageProcessorAudioScope.bind(this)
    );

    if (!this.audioNode) throw new Error("Audio is not initialized");

    this.gainNode = spWeb.audioContext.createGain();
    if (!this.gainNode) throw new Error("Gain is not initialized");

    this.audioNode.connect(this.gainNode);
    this.gainNode.connect(spWeb.audioContext.destination);
    this.audioNode.onprocessorerror = this.onProcessorError;
  }

  private onProcessorError(e: any) {
    console.error(e);
  }

  private onMessageProcessorAudioScope(message: IncomeMessage) {
    switch (message.action) {
      case "state":
        if (message.state.playing !== this.state.playing) {
          if (message.state.playing) {
            this.emit("playing");
          } else {
            this.emit("pause");
          }
        }
        if (message.state.position !== this.state.position) {
          this.emit("timeupdate", message.state.position);
        }
        if (message.state.duration !== this.state.duration) {
          this.emit("durationchange", message.state.duration);
        }
        if (message.state.opened !== this.state.opened) {
          if (message.state.opened) {
            this.emit("canplay");
          }
        }

        this.state = message.state;
        break;
      case "loaded":
        this.emit("loaded");
        break;
      default:
        console.log("event", message);
        break;
    }
  }

  async load(url: string) {
    this.audioNode?.sendMessageToAudioScope({
      action: "load",
      url,
    });

    await new Promise((resolve) => {
      this.once("canplay", resolve);
    });
  }

  async play() {
    this.audioNode?.sendMessageToAudioScope({
      action: "play",
    });
  }

  pause() {
    this.audioNode?.sendMessageToAudioScope({
      action: "pause",
    });
  }

  stop() {
    this.audioNode?.sendMessageToAudioScope({
      action: "stop",
    });
  }

  set volume(volume: number) {
    if (!this.gainNode) throw new Error("Gain is not initialized");
    this.gainNode.gain.value = volume;
  }

  set pitch(pitch: number) {
    this.audioNode?.sendMessageToAudioScope({
      action: "set-pitch",
      pitch,
    });
  }

  set tempo(tempo: number) {
    this.audioNode?.sendMessageToAudioScope({
      action: "set-tempo",
      tempo,
    });
  }

  set time(time: number) {
    const position = time * 1000;

    this.audioNode?.sendMessageToAudioScope({
      action: "set-position",
      position,
    });
  }
}

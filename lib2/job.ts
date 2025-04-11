import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";

export abstract class AbstractJob<I, O> extends EventEmitter {
  id: string;
  input: I;
  controller: AbortController;

  constructor(input: I) {
    super();
    this.id = uuidv4();
    this.input = input;
    this.controller = new AbortController();
  }

  init() {
    this.id = uuidv4();
    this.controller = new AbortController();
  }

  async execute() {
    this.emit("status", "running");

    try {
      const output = await this.run();
      this.emit("status", "done");
      this.emit("output", output);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        this.emit("status", "aborted");
      } else {
        this.emit("status", "error");
        this.emit("error", error);
      }
    }
  }

  async run(): Promise<O> {
    throw new Error("Method not implemented.");
  }

  abort() {
    this.controller.abort();
  }
}

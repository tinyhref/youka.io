import { MayIReason } from "./server";

export class MayIError extends Error {
  constructor(message: string, public reason: MayIReason) {
    super(message);
    this.name = "MayIError";
  }
}

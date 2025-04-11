import { InputTrim, OutputTrim } from "@/types";
import { AbstractJob } from "../job";
import * as library from "@/lib/library";

export class JobTrim extends AbstractJob<InputTrim, OutputTrim> {
  public readonly type = "trim";
  public readonly name = "Trim";

  async run() {
    return library.trim(this.input);
  }
}

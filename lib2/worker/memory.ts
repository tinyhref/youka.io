import { EventEmitter } from "events";
import { IWorkerController } from "@/types";
import PQueue from "p-queue";
import * as report from "@/lib/report";

interface MemoryWorkerOptions {
  concurrency?: number;
}

export default class MemoryWorker<T> extends EventEmitter
  implements IWorkerController<T> {
  public queue: PQueue;

  constructor({ concurrency }: MemoryWorkerOptions) {
    super();
    this.queue = new PQueue({ concurrency });
  }

  addJob(job: any) {
    this.queue
      .add(() => job.execute(), { signal: job.controller.signal })
      .catch((e) => {
        if (!(e instanceof DOMException)) {
          report.error(e);
        }
      });
    this.emit("add", job);
  }

  redoJob(job: any) {
    this.queue
      .add(() => job.execute(), { signal: job.controller.signal })
      .catch((e) => {
        if (!(e instanceof DOMException)) {
          report.error(e);
        }
      });
  }

  clearJobs() {
    this.queue.clear();
    this.emit("empty");
  }
}

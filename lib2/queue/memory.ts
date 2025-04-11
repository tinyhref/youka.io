import { EventEmitter } from "events";
import { IQueueController } from "@/types";

export default class MemoryQueue<T extends { qid: string }> extends EventEmitter
  implements IQueueController<T> {
  items: T[] = [];
  index: number = 0;

  get current(): T | undefined {
    if (this.index >= this.items.length) {
      return undefined;
    }
    return this.items[this.index];
  }

  set current(item: T | undefined) {
    if (item === undefined) {
      return;
    }

    const index = this.items.findIndex((i) => i.qid === item.qid);

    if (index === -1) {
      return;
    }
    this.index = index;

    if (this.current !== undefined) {
      this.emit("current", this.current);
    }
  }

  get hasNext(): boolean {
    return this.index < this.items.length - 1;
  }

  next(): T | undefined {
    if (this.index >= this.items.length - 1) {
      return;
    }
    this.index += 1;

    this.emit("current", this.current);
    return this.current;
  }

  prev(): T | undefined {
    if (this.index <= 0 || this.items.length === 0) {
      this.current = undefined;
      return this.current;
    }

    this.index -= 1;

    this.emit("current", this.current);
    return this.current;
  }

  move(from: number, to: number): void {
    if (from < 0 || from >= this.items.length) {
      return;
    }
    if (to < 0 || to >= this.items.length) {
      return;
    }

    const item = this.items[from];
    this.items.splice(from, 1);
    this.items.splice(to, 0, item);

    this.emit("change", this.items);
  }

  setItems(items: T[]): void {
    this.items = items;
    this.emit("change", this.items);
  }

  append(item: T): void {
    this.items.push({ ...item });
    this.emit("add", item);
    this.emit("change", this.items);
  }

  prepend(item: T): void {
    this.items.unshift({ ...item });
    this.emit("add", item);
    this.emit("change", this.items);
  }

  remove(item: T): void {
    const index = this.items.findIndex((i) => i.qid === item.qid);
    if (index !== -1) {
      this.items.splice(index, 1);
    }
    this.emit("remove", item);
    this.emit("change", this.items);
  }

  clear(): void {
    this.items = [];
    this.emit("change", this.items);
  }

  update(item: T): void {
    const index = this.items.findIndex((i) => i.qid === item.qid);
    if (index !== -1) {
      this.items[index] = item;
    }
  }
}

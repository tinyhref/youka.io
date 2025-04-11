import { AssPlugin, Position } from "../types";
import { Ass, Dialogue } from "./../ass";
import { decimalToHex, isEven } from "../utils";
import { IStyleOptions } from "@/types";
import { ALL_SINGERS_ID } from "@/consts";
import { AssPluginOptionsBase } from "./types";

export const AssBoxPluginId = "box";

export interface AssBoxPluginOptions extends AssPluginOptionsBase {
  id: "box";
  height: number;
  width: number;
  alpha: number;
  style: IStyleOptions;
  firstSingerPosition: Position;
  secondSingerPosition: Position;
  bothSingerPosition: Position;
  fadeInMs?: number;
  fadeOutMs?: number;
}

export class AssBoxPlugin implements AssPlugin {
  id = AssBoxPluginId;

  settings: AssBoxPluginOptions;

  constructor(settings: AssBoxPluginOptions) {
    this.settings = settings;
  }

  apply(ass: Ass) {
    if (!this.settings.enabled) return;

    ass.styles.add(this.settings.style);

    const alphaHex = decimalToHex(this.settings.alpha);
    const events = ass.events.events;

    const singerIdsSet = new Set<number>();
    events.forEach((event) => {
      if (!event.alignment) return;
      event.alignment.singer = event.alignment.singer || 0;
      const singer = event.alignment.singer;
      singerIdsSet.add(singer);
    });

    // Create a map to track the index of each event in the original events array
    const eventIndices = new Map<Dialogue, number>();
    events.forEach((event, index) => {
      eventIndices.set(event, index);
    });

    // Group events where the gap between them is less than 3 seconds
    const groups: {
      start: number;
      end: number;
      events: Dialogue[];
      singer: number;
    }[] = [];

    singerIdsSet.forEach((singerId) => {
      let currentGroup = null;
      // Filter events that include the 'karaoke' plugin
      const karaokeEvents = events.filter(
        (event) =>
          event.plugins.includes("karaoke") &&
          event.alignment &&
          event.alignment.singer === singerId
      );

      // Sort events by start time
      karaokeEvents.sort((a, b) => a.start - b.start);

      for (const event of karaokeEvents) {
        if (!currentGroup) {
          currentGroup = {
            start: event.start,
            end: event.end,
            events: [event],
            singer: singerId,
          };
          groups.push(currentGroup);
        } else {
          const gap = event.start - currentGroup.end;
          if (gap < 3) {
            // Extend the current group
            currentGroup.end = Math.max(currentGroup.end, event.end);
            currentGroup.events.push(event);
          } else {
            // Start a new group
            currentGroup = {
              start: event.start,
              end: event.end,
              events: [event],
              singer: singerId,
            };
            groups.push(currentGroup);
          }
        }
      }
    });

    // For each group, create a single dialogue spanning from the start to the end of the group
    for (const group of groups) {
      let x, y;

      if (group.singer === ALL_SINGERS_ID) {
        x = this.settings.bothSingerPosition.x;
        y = this.settings.bothSingerPosition.y;
      } else if (!group.singer || isEven(group.singer)) {
        x = this.settings.firstSingerPosition.x;
        y = this.settings.firstSingerPosition.y;
      } else {
        x = this.settings.secondSingerPosition.x;
        y = this.settings.secondSingerPosition.y;
      }

      let start = group.start;
      let end = group.end;

      const fadeInMs = this.settings.fadeInMs || 0;
      const fadeOutMs = this.settings.fadeOutMs || 0;
      const fadeInSec = fadeInMs / 1000 || 0;
      const fadeOutSec = fadeOutMs / 1000 || 0;

      let fadeTag = "";
      if (fadeInMs || fadeOutMs) {
        fadeTag = `\\fad(${fadeInMs || 0},${fadeOutMs || 0})`;

        if (fadeInMs) {
          start = group.start - fadeInSec;
        }

        if (fadeOutMs) {
          end = group.end + fadeOutSec;
        }
      }

      const posTag = `\\pos(${x},${y})`;

      const text = `{${fadeTag}\\alpha&H${alphaHex}&${posTag}\\p1}m 0 0 l ${this.settings.width} 0 ${this.settings.width} ${this.settings.height} 0 ${this.settings.height}{\\p0}`;

      const dialogue = new Dialogue({
        plugin: this.id,
        style: this.settings.style.name,
        start,
        end,
        text,
        layer: -1,
      });

      // Find the index of the first event in the group
      const firstEvent = group.events[0];
      const firstIndex = eventIndices.get(firstEvent);

      if (firstIndex !== undefined) {
        // Insert the dialogue before the first event in the group
        events.splice(firstIndex, 0, dialogue);
      } else {
        // If not found, append at the end
        events.push(dialogue);
      }
    }
  }
}

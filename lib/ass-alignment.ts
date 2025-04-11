import {
  Alignment3,
  AlignmentPluginOptions,
  AssPluginOptions,
  SubtitlesLoadOptions,
  SubtitlesPreset,
} from "@/types";
import {
  Ass,
  Ass123Plugin,
  AssOffsetPlugin,
  AssProgressBarPlugin,
  AssTitlePlugin,
  AssFadePlugin,
  AssIndicatorPlugin,
  AssPlugin,
} from "./ass";
import { Ass2Renderer } from "./ass2";
import { AssCountdownPlugin } from "./ass/plugins/countdown";
import { alignment2ToAlignment3, AlignmentMaxCharPlugin } from "./alignment";
import { AssBoxPlugin } from "./ass/plugins/box";
import { AlignmentAutoBreakPlugin } from "./alignment/plugins/autobreak";
import { Ass3Renderer } from "./ass3";
import { Ass4Renderer } from "./ass4";
import { AssPluginRuntime } from "./ass/plugins/types";

export function getAss(
  alignment: Alignment3,
  subtitlesPreset: SubtitlesPreset,
  runtime: AssPluginRuntime
) {
  let localAlignment = structuredClone(alignment);

  const alignmentPlugins = alignmentPluginsFactory(
    subtitlesPreset.alignmentPlugins
  );
  alignmentPlugins.forEach((plugin) => {
    localAlignment = plugin.apply(localAlignment);
  });

  const assRenderer = assRendererFactory(
    localAlignment,
    subtitlesPreset,
    runtime
  );

  let ass = assRenderer.ass();

  const assPlugins = assPluginsFactory(subtitlesPreset.assPlugins, runtime);

  assPlugins.forEach((plugin) => {
    plugin.apply(ass);
  });

  return ass;
}

export function assRendererFactory(
  alignment: Alignment3,
  subtitlesPreset: SubtitlesPreset,
  runtime: AssPluginRuntime
) {
  if (runtime.lang === "zh") {
    alignment = mergeWordsAlignment(alignment);
  }
  switch (subtitlesPreset.assRendererSettings.id) {
    case "ass2":
      const ass2RendererOptions = {
        alignment,
        rtl: runtime.rtl,
        styleOptionsMapping: runtime.styleOptionsMapping,
        assSettings: subtitlesPreset.assRendererSettings,
        resolution: subtitlesPreset.baseResolution,
      };
      return new Ass2Renderer(ass2RendererOptions);
    case "ass3":
      const ass3RendererOptions = {
        alignment,
        rtl: runtime.rtl,
        styleOptionsMapping: runtime.styleOptionsMapping,
        assSettings: subtitlesPreset.assRendererSettings,
        resolution: subtitlesPreset.baseResolution,
      };
      return new Ass3Renderer(ass3RendererOptions);
    case "ass4":
      const ass4RendererOptions = {
        alignment,
        rtl: runtime.rtl,
        styleOptionsMapping: runtime.styleOptionsMapping,
        assSettings: subtitlesPreset.assRendererSettings,
        resolution: subtitlesPreset.baseResolution,
      };
      return new Ass4Renderer(ass4RendererOptions);
  }
}

function alignmentPluginFactory(options: AlignmentPluginOptions) {
  switch (options.id) {
    case "autobreak":
      return new AlignmentAutoBreakPlugin(options);
    case "maxchar":
      return new AlignmentMaxCharPlugin(options);
  }
}

function alignmentPluginsFactory(pluginsOptions: AlignmentPluginOptions[]) {
  return pluginsOptions.map(alignmentPluginFactory);
}

function assPluginFactory(
  options: AssPluginOptions,
  runtime: AssPluginRuntime
) {
  switch (options.id) {
    case "title":
      return new AssTitlePlugin(options, runtime);
    case "123":
      return new Ass123Plugin(options, runtime);
    case "indicator":
      return new AssIndicatorPlugin(options, runtime);
    case "countdown":
      return new AssCountdownPlugin(options, runtime);
    case "progressbar":
      return new AssProgressBarPlugin(options, runtime);
    case "offset":
      return new AssOffsetPlugin(options);
    case "fade":
      return new AssFadePlugin(options);
    case "box":
      return new AssBoxPlugin(options);
  }
}

function assPluginsFactory(
  pluginsOptions: AssPluginOptions[],
  runtime: any
): AssPlugin[] {
  return pluginsOptions.map((options) => assPluginFactory(options, runtime));
}

export function alignmentToAss({
  alignment: alignment2,
  preset,
  runtime,
}: SubtitlesLoadOptions): Ass | undefined {
  if (!alignment2.alignment?.length) return;

  let alignment = alignment2ToAlignment3(alignment2);

  if (!alignment?.lines?.length) return;

  const ass = getAss(alignment, preset, runtime);

  return ass;
}

export interface AlignmentV2LineOptions {
  title: boolean;
}

export function mergeWordsAlignment(alignment: Alignment3): Alignment3 {
  return {
    ...alignment,
    lines: alignment.lines.map((line) => {
      return {
        start: line.start,
        end: line.end,
        text: line.text.trim(),
        singer: line.singer,
        words: [
          {
            start: line.words[0].start,
            end: line.words[line.words.length - 1].end,
            text: line.words.map((word) => word.text).join(""),
            subwords: line.words.map((word) => ({
              start: word.start,
              end: word.end,
              text: word.text,
            })),
          },
        ],
      };
    }),
  };
}

import React from "react";
import { SettingsItemContainer } from "../SettingsItemContainer";
import {
  AlignmentPluginOptions,
  AssPluginOptions,
  AssRendererSettings,
  AssRendererType,
  Resolution,
  SubtitlesPreset,
} from "@/types";
import { AssProgressBarPluginSettings } from "./subtitles/ProgressBarSettings";
import { Ass123PluginSettings } from "./subtitles/123Settings";
import { AssCountdownPluginSettings } from "./subtitles/CountdownSettings";
import { AssTitlePluginSettings } from "./subtitles/TitleSettings";
import { AssFadePluginSettings } from "./subtitles/FadeSettings";
import { AssOffsetPluginSettings } from "./subtitles/OffsetSettings";
import { AlignmentMaxCharPluginSettings } from "./subtitles/MaxCharSettings";
import { AssBoxPluginSettings } from "./subtitles/BoxSettings";
import { Ass4SettingsPlugin } from "./subtitles/Ass4Settings";
import { AssIndicatorPluginSettings } from "./subtitles/IndicatorSettings";
import { Ass123PluginId } from "@/lib/ass";
import { AlignmentAutoBreakPluginSettings } from "./subtitles/AutoLineBreakSettings";
import { Ass3PluginSettings } from "./subtitles/Ass3Settings";
import { AssPluginRuntime } from "@/lib/ass/plugins/types";
import { SettingsContainer } from "../SettingsContainer";
import InputResolution from "@/components/InputResolution";
import { useTranslation } from "react-i18next";
import InputAssRenderer from "@/components/InputAssRenderer";
import {
  DefaultAss2Settings,
  DefaultAss3Settings,
  DefaultAss4Settings,
} from "@/consts";
import { Ass3LayoutSettings } from "./subtitles/Ass3LayoutSettings";
import { Ass2LayoutSettings } from "./subtitles/Ass2LayoutSettings";

interface Props {
  value: SubtitlesPreset;
  onChange: (value: SubtitlesPreset) => void;
  runtime: AssPluginRuntime;
}

export function SettingSubtitlesPreset({ value, onChange, runtime }: Props) {
  const { t } = useTranslation();
  function handleAssPluginOptionsChange(options: AssPluginOptions) {
    const localValue = structuredClone(value);
    const index = localValue.assPlugins.findIndex((p) => p.id === options.id);
    if (index === -1) return;
    localValue.assPlugins[index] = options;
    onChange(localValue);
  }

  function handleAssRendererSettingsChange(settings: AssRendererSettings) {
    const localValue = structuredClone(value);
    localValue.assRendererSettings = settings;
    onChange(localValue);
  }

  function handleAlignmentPluginOptionsChange(options: AlignmentPluginOptions) {
    const localValue = structuredClone(value);
    const index = localValue.alignmentPlugins.findIndex(
      (p) => p.id === options.id
    );
    if (index === -1) return;
    localValue.alignmentPlugins[index] = options;
    onChange(localValue);
  }

  function renderAlignmentPlugins(
    plugins: AlignmentPluginOptions[],
    runtime: AssPluginRuntime,
    subtitlesPreset: SubtitlesPreset
  ) {
    return plugins.map((plugin) => {
      return (
        <div key={plugin.id}>
          {renderAlignmentPlugin(plugin, runtime, subtitlesPreset)}
        </div>
      );
    });
  }

  function renderAlignmentPlugin(
    plugin: AlignmentPluginOptions,
    runtime: AssPluginRuntime,
    subtitlesPreset: SubtitlesPreset
  ) {
    switch (plugin.id) {
      case "maxchar":
        return (
          <AlignmentMaxCharPluginSettings
            settings={plugin}
            setSettings={handleAlignmentPluginOptionsChange}
            runtime={runtime}
            subtitlesPreset={subtitlesPreset}
          />
        );
      case "autobreak":
        return (
          <AlignmentAutoBreakPluginSettings
            settings={plugin}
            setSettings={handleAlignmentPluginOptionsChange}
          />
        );
    }
  }

  function renderAssPluginsSettings(
    plugins: AssPluginOptions[],
    runtime: AssPluginRuntime,
    subtitlesPreset: SubtitlesPreset
  ) {
    return plugins.map((plugin) => {
      return (
        <div key={plugin.id}>
          {renderAssPluginSettings(plugin, subtitlesPreset, runtime)}
        </div>
      );
    });
  }

  function renderLayoutSettings(
    settings: AssRendererSettings,
    runtime: AssPluginRuntime,
    subtitlesPreset: SubtitlesPreset
  ) {
    switch (settings.id) {
      case "ass2":
        return (
          <Ass2LayoutSettings
            settings={settings}
            setSettings={handleAssRendererSettingsChange}
            runtime={runtime}
            subtitlesPreset={subtitlesPreset}
          />
        );
      case "ass3":
        return (
          <Ass3LayoutSettings
            settings={settings.subtitlesPosition}
            setSettings={(subtitlesPosition) =>
              handleAssRendererSettingsChange({
                ...settings,
                subtitlesPosition,
              })
            }
            runtime={runtime}
            subtitlesPreset={subtitlesPreset}
          />
        );
    }
  }

  function renderAssRendererSettings(
    settings: AssRendererSettings,
    runtime: AssPluginRuntime,
    subtitlesPreset: SubtitlesPreset
  ) {
    switch (settings.id) {
      case "ass3":
        return (
          <Ass3PluginSettings
            settings={settings}
            setSettings={handleAssRendererSettingsChange}
            runtime={runtime}
            subtitlesPreset={subtitlesPreset}
          />
        );
      case "ass4":
        return (
          <Ass4SettingsPlugin
            settings={settings}
            setSettings={handleAssRendererSettingsChange}
            runtime={runtime}
            subtitlesPreset={subtitlesPreset}
          />
        );
    }
  }

  function renderAssPluginSettings(
    pluginOptions: AssPluginOptions,
    subtitlesPreset: SubtitlesPreset,
    runtime: AssPluginRuntime
  ) {
    if (pluginOptions.id === Ass123PluginId) {
    }
    switch (pluginOptions.id) {
      case "123":
        return (
          <Ass123PluginSettings
            settings={pluginOptions}
            setSettings={handleAssPluginOptionsChange}
            runtime={runtime}
            subtitlesPreset={subtitlesPreset}
          />
        );
      case "progressbar":
        return (
          <AssProgressBarPluginSettings
            settings={pluginOptions}
            setSettings={handleAssPluginOptionsChange}
            runtime={runtime}
            subtitlesPreset={subtitlesPreset}
          />
        );
      case "title":
        return (
          <AssTitlePluginSettings
            settings={pluginOptions}
            setSettings={handleAssPluginOptionsChange}
            runtime={runtime}
            subtitlesPreset={subtitlesPreset}
          />
        );
      case "offset":
        return (
          <AssOffsetPluginSettings
            settings={pluginOptions}
            setSettings={handleAssPluginOptionsChange}
          />
        );
      case "countdown":
        return (
          <AssCountdownPluginSettings
            settings={pluginOptions}
            setSettings={handleAssPluginOptionsChange}
            runtime={runtime}
            subtitlesPreset={subtitlesPreset}
          />
        );
      case "indicator":
        return (
          <AssIndicatorPluginSettings
            settings={pluginOptions}
            setSettings={handleAssPluginOptionsChange}
            runtime={runtime}
            subtitlesPreset={subtitlesPreset}
          />
        );
      case "fade":
        return (
          <AssFadePluginSettings
            settings={pluginOptions}
            setSettings={handleAssPluginOptionsChange}
            runtime={runtime}
            subtitlesPreset={subtitlesPreset}
          />
        );
      case "box":
        return (
          <AssBoxPluginSettings
            settings={pluginOptions}
            setSettings={handleAssPluginOptionsChange}
            runtime={runtime}
            subtitlesPreset={subtitlesPreset}
          />
        );
    }
  }

  function handleBaseResolutionChange(resolution: Resolution) {
    const localValue = structuredClone(value);
    localValue.baseResolution = resolution;
    onChange(localValue);
  }

  function handleAssRendererChange(renderer: AssRendererType) {
    const localValue = structuredClone(value);
    switch (renderer) {
      case "ass2":
        localValue.assRendererSettings = DefaultAss2Settings;
        break;
      case "ass3":
        localValue.assRendererSettings = DefaultAss3Settings;
        break;
      case "ass4":
        localValue.assRendererSettings = DefaultAss4Settings;
        break;
    }
    onChange(localValue);
  }

  return (
    <SettingsItemContainer>
      <SettingsContainer title={t("General")}>
        <div className="flex flex-col gap-6">
          <InputAssRenderer
            withLabel
            value={value.assRendererSettings.id}
            onChange={handleAssRendererChange}
          />
          <InputResolution
            withLabel
            value={value.baseResolution}
            onChange={handleBaseResolutionChange}
          />
        </div>
      </SettingsContainer>
      {renderLayoutSettings(value.assRendererSettings, runtime, value)}
      {renderAssPluginsSettings(value.assPlugins, runtime, value)}
      {renderAlignmentPlugins(value.alignmentPlugins, runtime, value)}
      {renderAssRendererSettings(value.assRendererSettings, runtime, value)}
    </SettingsItemContainer>
  );
}

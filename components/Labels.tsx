import { formatId } from "@/lib/utils";
import { Alignment2, ISongStem } from "@/types";
import React from "react";
import { useTranslation } from "react-i18next";

export function SplitModelId2Label({ modelId }: { modelId: string }) {
  const { t } = useTranslation();

  let label = modelId;
  switch (modelId) {
    case "auto":
      label = t("Auto");
      break;
    case "imported":
      label = t("Imported");
      break;
    case "original":
      label = t("Original");
      break;
    case "bs_roformer":
      label = "RoFormer";
      break;
    case "mdx23c":
      label = "MDX-23C";
      break;
    case "uvr_mdxnet_kara_2":
      label = `MDX-Net (${t("With Backing Vocals")})`;
      break;
    case "demucs":
      label = "Demucs";
      break;
    case "karafun":
      label = "Karafun";
      break;
    case "mel_band_roformer_instrumental_becruily":
      label = "RoFormer (becruily)";
      break;
    case "mel_band_roformer_instrumental_instv7_gabox":
      label = "RoFormer (instv7_gabox)";
      break;
    default:
      label = modelId;
  }

  return <>{label}</>;
}

export function Stem2Label({ stem }: { stem: ISongStem }) {
  const { t } = useTranslation();

  if (stem.title) return <>{stem.title}</>;

  let label = stem.modelId;
  switch (stem.modelId) {
    case "auto":
      label = t("Auto");
      break;
    case "imported":
      label = t("Imported");
      break;
    case "original":
      label = t("Original");
      break;
    case "bs_roformer":
      label = "RoFormer";
      break;
    case "mdx23c":
      label = "MDX-23C";
      break;
    case "uvr_mdxnet_kara_2":
      label = `MDX-Net (${t("With Backing Vocals")})`;
      break;
    case "demucs":
      label = "Demucs";
      break;
    case "karafun":
      label = "Karafun";
      break;
    case "mel_band_roformer_instrumental_becruily":
      label = "RoFormer (becruily)";
      break;
    case "mel_band_roformer_instrumental_instv7_gabox":
      label = "RoFormer (instv7_gabox)";
      break;
    case "custom":
      label = t("Custom") + " (" + formatId(stem.groupId || stem.id) + ")";
      break;
    default:
      label = stem.modelId;
  }

  return <>{label}</>;
}

export function Alignment2Label({ alignment }: { alignment: Alignment2 }) {
  const { t } = useTranslation();

  let label = alignment.modelId;
  switch (alignment.modelId) {
    case "karafun":
      label = "Karafun";
      break;
    case "imported":
      label = t("Imported");
      break;
    case "audioshake-transcription":
      label = `AudioShakeAI (${t("Transcription")})`;
      break;
    case "audioshake-alignment":
      label = `AudioShakeAI (${t("Alignment")})`;
      break;
    case "wav2vec2":
      label = `Wav2Vec2 (${t("Legacy")})`;
      break;
    case "wav2vec2-en":
      label = "Wav2Vec2 (English)";
      break;
    case "wav2vec2-es":
      label = "Wav2Vec2 (Spanish)";
      break;
    case "wav2vec2-fr":
      label = "Wav2Vec2 (French)";
      break;
    case "wav2vec2-it":
      label = "Wav2Vec2 (Italian)";
      break;
    case "wav2vec2-pt":
      label = "Wav2Vec2 (Portuguese)";
      break;
    case "whisper":
      label = `Whisper (${t("Transcription")})`;
      break;
    case "line":
      label = "Line (Manual)";
      break;
    case "custom":
      label =
        t("Custom") + " (" + formatId(alignment.groupId || alignment.id) + ")";
      break;
    case "off":
      label = t("Off");
      break;
    default:
      label = alignment.modelId;
      break;
  }

  return <>{label}</>;
}

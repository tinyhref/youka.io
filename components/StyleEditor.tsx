import React from "react";
import { useTranslation } from "react-i18next";
import { IStyleOptions } from "@/types";
import { faBold, faFont, faItalic } from "@fortawesome/free-solid-svg-icons";
import { ColorPickerSelect } from "./StyleEditor/ColorPickerSelect";
import { FontInput } from "./StyleEditor/FontInput";
import { BoolInput } from "./StyleEditor/BoolInput";
import { NumberInput } from "./StyleEditor/NumberInput";
import { AlignmentSelectInput } from "./StyleEditor/AlignmentSelectInput";
import { BorderStyleSelectInput } from "./StyleEditor/BorderStyleSelectInput";

export interface StyleEditorProps {
  style: IStyleOptions;
  onChange: (style: IStyleOptions) => void;
  withAll?: boolean;
  withFontName?: boolean;
  withFontSize?: boolean;
  withBold?: boolean;
  withItalic?: boolean;
  withUppercase?: boolean;
  withSpacing?: boolean;
  withOutline?: boolean;
  withShadow?: boolean;
  withMarginBottom?: boolean;
  withBorderStyle?: boolean;
  withAlignment?: boolean;
  withPrimaryColor?: boolean;
  withActiveColor?: boolean;
  withSecondaryColor?: boolean;
  withBackColor?: boolean;
  withOutlineColor?: boolean;
  withActiveOutlineColor?: boolean;
  withShadowColor?: boolean;
  withBlur?: boolean;
  withPrimaryColorText?: string;
  withSecondaryColorText?: string;
  withOutlineColorText?: string;
  withAlpha?: boolean;
}

export function StyleEditor({
  style,
  onChange,
  withAll,
  ...props
}: StyleEditorProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col justify-center">
      <div className="max-w-full flex flex-col flex-wrap gap-4">
        <div className="flex flex-row flex-wrap gap-2">
          {(withAll || props.withPrimaryColor) && (
            <ColorPickerSelect
              label={props.withPrimaryColorText ?? t("Primary Color")}
              color={style.primaryColour}
              onChange={(c) => {
                onChange({ ...style, primaryColour: c });
              }}
            />
          )}

          {(withAll || props.withActiveColor) && (
            <ColorPickerSelect
              label={t("Active Line Color")}
              color={style.activeColour}
              onChange={(c) => {
                onChange({ ...style, activeColour: c });
              }}
            />
          )}

          {(withAll || props.withSecondaryColor) && (
            <ColorPickerSelect
              label={props.withSecondaryColorText ?? t("Secondary Color")}
              color={style.secondaryColour}
              onChange={(c) => {
                onChange({ ...style, secondaryColour: c });
              }}
            />
          )}

          {(withAll || props.withActiveOutlineColor) && (
            <ColorPickerSelect
              label={t("Active Outline Color")}
              color={style.activeOutlineColor}
              onChange={(c) => {
                onChange({ ...style, activeOutlineColor: c });
              }}
            />
          )}

          {(withAll || props.withOutlineColor) && (
            <ColorPickerSelect
              label={props.withOutlineColorText ?? t("Outline Color")}
              color={style.outlineColour}
              onChange={(c) => {
                onChange({ ...style, outlineColour: c });
              }}
            />
          )}

          {(withAll || props.withShadowColor) && (
            <ColorPickerSelect
              label={t("Shadow Color")}
              color={style.backColour}
              onChange={(c) => {
                onChange({ ...style, backColour: c });
              }}
            />
          )}
        </div>

        <div className="flex flex-row flex-wrap gap-2">
          {(withAll || props.withFontName) && (
            <FontInput
              label={t("Font Name")}
              value={style.fontname}
              onChange={(value) => {
                onChange({ ...style, fontname: value });
              }}
            />
          )}

          {(withAll || props.withFontSize) && (
            <NumberInput
              label={t("Font Size")}
              value={style.fontsize}
              onValueChange={(value) => onChange({ ...style, fontsize: value })}
            />
          )}

          {(withAll || props.withBold) && (
            <BoolInput
              label={t("Bold")}
              value={style.bold}
              icon={faBold}
              onChange={(value) => onChange({ ...style, bold: value })}
            />
          )}

          {(withAll || props.withItalic) && (
            <BoolInput
              label={t("Italic")}
              value={style.italic}
              icon={faItalic}
              onChange={(value) => onChange({ ...style, italic: value })}
            />
          )}

          {(withAll || props.withUppercase) && (
            <BoolInput
              label={t("Uppercase")}
              value={style.uppercase}
              icon={faFont}
              onChange={(value) => onChange({ ...style, uppercase: value })}
            />
          )}

          {(withAll || props.withSpacing) && (
            <NumberInput
              label={t("Spacing")}
              value={style.spacing}
              onValueChange={(value) => onChange({ ...style, spacing: value })}
            />
          )}

          {(withAll || props.withOutline) && (
            <NumberInput
              label={t("Outline")}
              value={style.outline}
              onValueChange={(value) => onChange({ ...style, outline: value })}
            />
          )}

          {(withAll || props.withBlur) && (
            <NumberInput
              label={"Blur"}
              min={0}
              value={style.blur ?? 0}
              onValueChange={(value) => onChange({ ...style, blur: value })}
            />
          )}

          {(withAll || props.withAlpha) && (
            <NumberInput
              min={0}
              max={255}
              step={10}
              label={t("Alpha")}
              value={style.alpha ?? 0}
              onValueChange={(value) =>
                onChange({ ...style, alpha: value ?? 0 })
              }
            />
          )}

          {(withAll || props.withShadow) && (
            <NumberInput
              label={t("Shadow")}
              value={style.shadow}
              onValueChange={(value) => onChange({ ...style, shadow: value })}
            />
          )}

          {(withAll || props.withMarginBottom) && (
            <NumberInput
              label={t("Margin Bottom")}
              value={style.marginV}
              onValueChange={(value) => onChange({ ...style, marginV: value })}
            />
          )}

          {(withAll || props.withBorderStyle) && (
            <BorderStyleSelectInput
              label={t("Border Style")}
              value={style.borderStyle}
              onChange={(borderStyle) => onChange({ ...style, borderStyle })}
            />
          )}

          {(withAll || props.withAlignment) && (
            <AlignmentSelectInput
              label={t("Line Alignment")}
              value={style.alignment}
              onChange={(alignment) => onChange({ ...style, alignment })}
            />
          )}
        </div>
      </div>
    </div>
  );
}

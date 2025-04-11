import React from "react";
import { SettingsItemContainer } from "../SettingsItemContainer";
import { useTranslation } from "react-i18next";
import { StyleEditor, StyleEditorProps } from "@/components/StyleEditor";

interface Props extends StyleEditorProps {
  label?: string;
}

export function SettingStyle(props: Props) {
  const { t } = useTranslation();

  return (
    <SettingsItemContainer title={props.label || t("Style")}>
      <StyleEditor {...props} />
    </SettingsItemContainer>
  );
}

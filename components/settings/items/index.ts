import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import * as general from "./general";
import * as subtitles from "./subtitles";
import * as styles from "./styles";
import * as stylemapping from "./stylemapping";

export interface SettingsItemProps {}

export interface SettingsItem {
  Comp: (props: SettingsItemProps) => React.ReactElement;
  Title: () => string;
  key: string;
  icon: IconDefinition;
}

export const Items: SettingsItem[] = [general, subtitles, styles, stylemapping];

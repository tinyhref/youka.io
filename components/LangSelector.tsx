import React, { useEffect } from "react";
import { useSettingsStore } from "@/stores/settings";
import i18n, { languages } from "@/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";

export function LangSelector() {
  const [lang, setLang] = useSettingsStore((state) => [
    state.lang,
    state.setLang,
  ]);

  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang]);

  return (
    <Select value={lang} onValueChange={(key) => setLang(key)}>
      <SelectTrigger className="w-[120px]">
        <FontAwesomeIcon icon={faGlobe} className="mr-2" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {languages.map((language) => (
          <SelectItem key={language.code} value={language.code}>
            {language.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

import React, { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "./ui/scroll-area";
import { Label } from "./ui/label";
import { useTranslation } from "react-i18next";

interface Props {
  value?: string;
  onChange: (key: string) => void;
  withLabel?: boolean;
  withTopValue?: boolean;
}

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export function LyricsLangSelect({
  value,
  onChange,
  withLabel,
  withTopValue,
}: Props) {
  const { t, i18n } = useTranslation();
  const topLang = useMemo(
    () =>
      withTopValue
        ? DefaultLanguages.find((lang) => lang.code === i18n.language)
        : undefined,
    [withTopValue, i18n.language]
  );
  const langs = useMemo(() => {
    if (topLang) {
      return DefaultLanguages.filter((lang) => lang.code !== topLang.code);
    }
    return DefaultLanguages;
  }, [topLang]);

  return (
    <div className="flex flex-col gap-2">
      {withLabel && <Label>{t("Lyrics Language")}</Label>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="min-w-[120px] w-fit">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="overflow-auto">
          {topLang && (
            <>
              <SelectItem key={topLang.code} value={topLang.code}>
                {topLang.nativeName}
              </SelectItem>
              <SelectSeparator />
            </>
          )}
          <ScrollArea className="h-72">
            {langs.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                <span>{lang.name}</span>
                <span className="mx-2 text-xs text-muted-foreground">
                  {lang.nativeName}
                </span>
              </SelectItem>
            ))}
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
}

const DefaultLanguages: Language[] = [
  { name: "Afrikaans", nativeName: "Afrikaans", code: "af" },
  { name: "Arabic", nativeName: "العربية", code: "ar" },
  { name: "Armenian", nativeName: "Հայերեն", code: "hy" },
  { name: "Azerbaijani", nativeName: "Azərbaycanca", code: "az" },
  { name: "Belarusian", nativeName: "Беларуская", code: "be" },
  { name: "Bosnian", nativeName: "Bosanski", code: "bs" },
  { name: "Bulgarian", nativeName: "Български", code: "bg" },
  { name: "Catalan", nativeName: "Català", code: "ca" },
  { name: "Chinese", nativeName: "中文", code: "zh" },
  { name: "Croatian", nativeName: "Hrvatski", code: "hr" },
  { name: "Czech", nativeName: "Čeština", code: "cs" },
  { name: "Danish", nativeName: "Dansk", code: "da" },
  { name: "Dutch", nativeName: "Nederlands", code: "nl" },
  { name: "English", nativeName: "English", code: "en" },
  { name: "Estonian", nativeName: "Eesti", code: "et" },
  { name: "Filipino", nativeName: "Filipino", code: "tl" },
  { name: "Finnish", nativeName: "Suomi", code: "fi" },
  { name: "French", nativeName: "Français", code: "fr" },
  { name: "Galician", nativeName: "Galego", code: "gl" },
  { name: "German", nativeName: "Deutsch", code: "de" },
  { name: "Greek", nativeName: "Ελληνικά", code: "el" },
  { name: "Hebrew", nativeName: "עברית", code: "he" },
  { name: "Hindi", nativeName: "हिन्दी", code: "hi" },
  { name: "Hungarian", nativeName: "Magyar", code: "hu" },
  { name: "Icelandic", nativeName: "Íslenska", code: "is" },
  { name: "Indonesian", nativeName: "Bahasa Indonesia", code: "id" },
  { name: "Italian", nativeName: "Italiano", code: "it" },
  { name: "Japanese", nativeName: "日本語", code: "ja" },
  { name: "Kannada", nativeName: "ಕನ್ನಡ", code: "kn" },
  { name: "Kazakh", nativeName: "Қазақша", code: "kk" },
  { name: "Korean", nativeName: "한국어", code: "ko" },
  { name: "Kurdish", nativeName: "Kurmanji", code: "ku" },
  { name: "Latvian", nativeName: "Latviešu", code: "lv" },
  { name: "Lithuanian", nativeName: "Lietuvių", code: "lt" },
  { name: "Macedonian", nativeName: "Македонски", code: "mk" },
  { name: "Maori", nativeName: "Māori", code: "mi" },
  { name: "Malay", nativeName: "Bahasa Melayu", code: "ms" },
  { name: "Marathi", nativeName: "मराठी", code: "mr" },
  { name: "Nepali", nativeName: "नेपाली", code: "ne" },
  { name: "Norwegian", nativeName: "Norsk", code: "no" },
  { name: "Persian", nativeName: "فارسی", code: "fa" },
  { name: "Polish", nativeName: "Polski", code: "pl" },
  { name: "Portuguese", nativeName: "Português", code: "pt" },
  { name: "Romanian", nativeName: "Română", code: "ro" },
  { name: "Russian", nativeName: "Русский", code: "ru" },
  { name: "Serbian", nativeName: "Српски", code: "sr" },
  { name: "Slovak", nativeName: "Slovenčina", code: "sk" },
  { name: "Slovenian", nativeName: "Slovenščina", code: "sl" },
  { name: "Spanish", nativeName: "Español", code: "es" },
  { name: "Swahili", nativeName: "Kiswahili", code: "sw" },
  { name: "Swedish", nativeName: "Svenska", code: "sv" },
  { name: "Tamil", nativeName: "தமிழ்", code: "ta" },
  { name: "Thai", nativeName: "ไทย", code: "th" },
  { name: "Turkish", nativeName: "Türkçe", code: "tr" },
  { name: "Ukrainian", nativeName: "Українська", code: "uk" },
  { name: "Urdu", nativeName: "اردو", code: "ur" },
  { name: "Vietnamese", nativeName: "Tiếng Việt", code: "vi" },
  { name: "Welsh", nativeName: "Cymraeg", code: "cy" },
];

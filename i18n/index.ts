import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { it } from "./it";
import { pt } from "./pt";
import { ar } from "./ar";
import { hi } from "./hi";
import { ru } from "./ru";
import { zh } from "./zh";

export const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "pt", name: "Português" },
  { code: "it", name: "Italiano" },
  { code: "de", name: "Deutsch" },
  { code: "ar", name: "العربية" },
  { code: "hi", name: "हिन्दी" },
  { code: "ru", name: "Русский" },
  { code: "zh", name: "简体中文" },
];

export function defaultLang() {
  try {
    const lang = window.navigator.language.split("-")[0];
    const supportedLang = languages.find((l) => l.code === lang);
    if (supportedLang) {
      return supportedLang.code;
    }
  } catch (e) {
    console.error(e);
  }
  return "en";
}

i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    en: { translation: en },
    es: { translation: es },
    fr: { translation: fr },
    it: { translation: it },
    pt: { translation: pt },
    ar: { translation: ar },
    hi: { translation: hi },
    ru: { translation: ru },
    zh: { translation: zh },
  },
  lng: "en",
  fallbackLng: "en",

  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

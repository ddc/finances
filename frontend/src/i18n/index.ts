import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en";
import ptBr from "./pt-br";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    "pt-br": { translation: ptBr },
  },
  lng: (() => { try { return localStorage.getItem("language") || "en"; } catch { return "en"; } })(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  react: { useSuspense: false, bindI18n: "languageChanged loaded", bindI18nStore: "added removed" },
});

export default i18n;

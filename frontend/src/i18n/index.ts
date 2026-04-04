import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en";
import ptBr from "./pt-br";

const savedLang = (() => {
  try {
    return localStorage.getItem("language") || "en";
  } catch {
    return "en";
  }
})();

i18n.use(initReactI18next);

i18n.init({
  resources: {
    en: { translation: en },
    "pt-br": { translation: ptBr },
  },
  lng: savedLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  react: {
    useSuspense: false,
    bindI18n: "languageChanged loaded",
    bindI18nStore: "added removed",
  },
});

export default i18n;

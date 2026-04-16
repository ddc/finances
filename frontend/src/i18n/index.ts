import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en";
import ptBr from "./pt-br";

const getSavedLang = (): string => {
  try { return localStorage.getItem("language") || "en"; } catch { return "en"; }
};

await i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    "pt-BR": { translation: ptBr },
  },
  lng: getSavedLang(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  react: {
    useSuspense: false,
    bindI18n: "languageChanged loaded",
    bindI18nStore: "added removed",
  },
});

export default i18n;
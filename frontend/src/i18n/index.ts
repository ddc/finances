import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en";
import ptBr from "./pt-br";

const savedLang = (() => {
  try { return localStorage.getItem("language") || "en"; } catch { return "en"; }
})();

const resources = {
  en: { translation: en },
  "pt-br": { translation: ptBr },
};

// Add resources manually before init so they're available synchronously
i18n.use(initReactI18next);
Object.entries(resources).forEach(([lng, ns]) => {
  i18n.addResourceBundle(lng, "translation", ns.translation, true, true);
});

i18n.init({
  resources,
  lng: savedLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  react: {
    useSuspense: false,
    bindI18n: "languageChanged loaded",
    bindI18nStore: "added removed",
  },
}).catch(() => {});

// Ensure language is applied even if init is async
i18n.language = savedLang;

export default i18n;

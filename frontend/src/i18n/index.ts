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

// Add resources directly before init
i18n.use(initReactI18next);

// Use synchronous-style init with all resources pre-loaded
void i18n.init({
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

// Force the language in case init hasn't applied it yet
if (i18n.language !== savedLang) {
  void i18n.changeLanguage(savedLang);
}

export default i18n;

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "./en.json";
import roTranslations from "./ro.json";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: enTranslations,
    },
    ro: {
      translation: roTranslations,
    },
  },
  lng: localStorage.getItem("language") || "ro", // default language
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // react already safes from xss
  },
});

export default i18n;

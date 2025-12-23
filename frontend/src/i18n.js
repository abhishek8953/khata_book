import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.js';
import hi from './locales/hi.js';

const resources = {
  en: en,
  hi: hi
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    interpolation: {
      escapeValue: false
    }
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
});

export default i18n;

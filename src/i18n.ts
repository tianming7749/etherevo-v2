// i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

const initI18n = () => {
  return i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      debug: true,
      lng: localStorage.getItem('i18nextLng') || 'en', // 从 localStorage 初始化语言
      fallbackLng: 'en',
      detection: {
        order: ['localStorage', 'cookie', 'querystring', 'navigator'],
        caches: ['localStorage', 'cookie'],
        lookupLocalStorage: 'i18nextLng',
        lookupCookie: 'i18next',
        lookupQuerystring: 'lng',
        checkWhitelist: true,
      },
      whitelist: ['en', 'zh'],
      interpolation: {
        escapeValue: false,
      },
      backend: {
        loadPath: '/locales/{{lng}}/{{ns}}.json',
        requestOptions: {
          cache: 'no-cache',
        },
      },
      react: {
        useSuspense: false,
      },
    })
    .catch((error) => {
      console.error('i18n initialization failed:', error);
      i18n.changeLanguage('en');
    });
};

export default i18n;
export { initI18n };
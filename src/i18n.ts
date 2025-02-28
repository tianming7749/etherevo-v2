// i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend'; // ✅ 导入 i18next-http-backend
import LanguageDetector from 'i18next-browser-languagedetector'; // ✅ 导入 i18next-browser-languagedetector

i18n
  // ✅  use i18next-http-backend
  .use(Backend)
  // ✅  use LanguageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  .init({
    debug: true, // ✅ 开启 debug 模式，方便调试
    lng: 'en', // ✅ 明确设置默认语言为英语
    fallbackLng: 'en', // ✅ 设置回退语言为英语
    detection: {
      order: ['localStorage', 'cookie', 'querystring', 'navigator'], // ✅ 优先使用 localStorage、cookie，之后才使用浏览器语言
      caches: ['localStorage', 'cookie'], // ✅ 缓存到 localStorage 和 cookie
      lookupLocalStorage: 'i18nextLng', // ✅ localStorage 中的语言参数
      lookupCookie: 'i18next', // ✅ cookie 中的语言参数
      lookupQuerystring: 'lng', // ✅ 查询字符串中的语言参数
      checkWhitelist: true, // ✅ 仅检测白名单中的语言
    },
    whitelist: ['en', 'zh'], // ✅ 限制检测的语言为英语和中文
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    backend: { // ✅ backend 配置项，配置 i18next-http-backend 插件
      loadPath: '/locales/{{lng}}/{{ns}}.json', // ✅ JSON 文件加载路径，指向 public/locales 目录
      requestOptions: {
        cache: 'no-cache', // 避免缓存问题
      },
    },
    // 预加载默认语言的翻译内容，避免挂起
    initialI18nStore: {
      en: { translation: {} }, // 预加载空的英语翻译
      zh: { translation: {} }, // 预加载空的中文翻译
    },
    initialLanguage: 'en', // 初始语言为英语
    react: {
      useSuspense: false, // 禁用 React 18 的 Suspense，防止挂起问题
    },
  })
  .catch((error) => {
    console.error('i18n initialization failed:', error);
    // 回退到英语，确保页面至少能显示默认语言
    i18n.changeLanguage('en');
  });

export default i18n;
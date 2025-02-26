// i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend'; //  ✅ 导入 i18next-http-backend
import LanguageDetector from 'i18next-browser-languagedetector'; //  ✅ 导入 i18next-browser-languagedetector

i18n
  // ✅  use i18next-http-backend
  .use(Backend)
  // ✅  use LanguageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/initialization-options
  .init({
    debug: true, //  ✅ 开启 debug 模式，方便调试
    fallbackLng: 'zh', //  ✅ 设置默认语言为 简体中文 (如果用户语言检测失败，或者没有设置语言)
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    backend: { //  ✅  backend 配置项，配置 i18next-http-backend 插件
      loadPath: '/locales/{{lng}}/{{ns}}.json', //  ✅  JSON 文件加载路径，指向 public/locales 目录
    },
    //  ✅  移除 resources 配置项，不再手动引入 JSON 文件
    // resources: {
    //   en: {
    //     translation: en,
    //   },
    //   zh: {
    //     translation: translationCN,
    //   },
    // },
  });

export default i18n;
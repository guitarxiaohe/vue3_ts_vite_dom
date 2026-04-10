export const APP_SUPPORTED_LOCALES = ['zh-CN', 'zh-TW', 'en-US'] as const

export type AppLocale = (typeof APP_SUPPORTED_LOCALES)[number]

export const APP_DEFAULT_LOCALE: AppLocale = 'zh-CN'

export const APP_LOCALE_STORAGE_KEY = 'app_locale'

export const APP_LOCALE_COOKIE_KEY = 'app_locale'

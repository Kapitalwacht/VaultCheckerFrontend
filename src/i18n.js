import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import es from './locales/es.json'

const LOCALE_KEY = 'vaultchecker-locale'

function loadLocale() {
    try {
        const stored = localStorage.getItem(LOCALE_KEY)
        if (stored === 'en' || stored === 'es') return stored
    } catch {}
    return 'es'
}

const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: loadLocale(),
    fallbackLocale: 'en',
    messages: { en, es }
})

export function setLocale(locale) {
    if (locale !== 'en' && locale !== 'es') return
    i18n.global.locale.value = locale
    try { localStorage.setItem(LOCALE_KEY, locale) } catch {}
}

export default i18n

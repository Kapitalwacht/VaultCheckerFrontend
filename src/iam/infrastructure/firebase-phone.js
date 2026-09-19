import { initializeApp, getApps } from 'firebase/app'
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'

const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const RECAPTCHA_CONTAINER_ID = 'recaptcha-container'

let authInstance = null
let recaptchaVerifier = null
let confirmationResult = null

export function isFirebasePhoneConfigured() {
    return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId)
}

function toE164(phone) {
    const cleaned = String(phone ?? '').replace(/[^\d+]/g, '')
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`
}

function ensureAuth() {
    if (!authInstance) {
        const app = getApps().length ? getApps()[0] : initializeApp(config)
        authInstance = getAuth(app)
    }
    return authInstance
}

function resetRecaptcha() {
    if (recaptchaVerifier) {
        try { recaptchaVerifier.clear() } catch {}
        recaptchaVerifier = null
    }
    const container = document.getElementById(RECAPTCHA_CONTAINER_ID)
    if (container) container.innerHTML = ''
}

export function sendPhoneCode(phone) {
    const auth = ensureAuth()
    resetRecaptcha()
    recaptchaVerifier = new RecaptchaVerifier(auth, RECAPTCHA_CONTAINER_ID, { size: 'invisible' })
    return signInWithPhoneNumber(auth, toE164(phone), recaptchaVerifier).then(result => {
        confirmationResult = result
        return result
    })
}

export function confirmPhoneCode(code) {
    if (!confirmationResult) return Promise.reject(new Error('no-confirmation'))
    return confirmationResult.confirm(String(code).trim())
}

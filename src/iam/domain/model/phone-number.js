export const PHONE_MAX_LENGTH = 20

export function sanitizePhoneInput(value) {
    const cleaned = String(value ?? '').replace(/[^\d+ ]/g, '').replace(/ {2,}/g, ' ')
    const leadingPlus = cleaned.trimStart().startsWith('+')
    const rest = cleaned.replace(/\+/g, '')
    return ((leadingPlus ? '+' : '') + rest.trimStart()).slice(0, PHONE_MAX_LENGTH)
}

export function normalizePhone(value) {
    return sanitizePhoneInput(value).trim()
}

export function isValidPhone(value) {
    const phone = normalizePhone(value)
    if (!/^\+\d[\d ]*$/.test(phone)) return false
    const digits = phone.replace(/\D/g, '').length
    return digits >= 8 && digits <= 15
}

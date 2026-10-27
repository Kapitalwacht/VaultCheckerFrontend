export const DEFAULT_COUNTRY = 'PE'

export const PHONE_COUNTRIES = [
    { iso: 'PE', dial: '51' },
    { iso: 'AR', dial: '54' },
    { iso: 'BO', dial: '591' },
    { iso: 'BR', dial: '55' },
    { iso: 'CL', dial: '56' },
    { iso: 'CO', dial: '57' },
    { iso: 'CR', dial: '506' },
    { iso: 'CU', dial: '53' },
    { iso: 'EC', dial: '593' },
    { iso: 'SV', dial: '503' },
    { iso: 'GT', dial: '502' },
    { iso: 'HN', dial: '504' },
    { iso: 'MX', dial: '52' },
    { iso: 'NI', dial: '505' },
    { iso: 'PA', dial: '507' },
    { iso: 'PY', dial: '595' },
    { iso: 'UY', dial: '598' },
    { iso: 'VE', dial: '58' },
    { iso: 'US', dial: '1' },
    { iso: 'ES', dial: '34' },
    { iso: 'IT', dial: '39' },
    { iso: 'FR', dial: '33' },
    { iso: 'DE', dial: '49' },
    { iso: 'GB', dial: '44' },
    { iso: 'PT', dial: '351' },
    { iso: 'CN', dial: '86' },
    { iso: 'JP', dial: '81' }
]

export function findCountry(iso) {
    return PHONE_COUNTRIES.find(c => c.iso === iso) ?? PHONE_COUNTRIES[0]
}

export function splitPhone(value) {
    const text = String(value ?? '').trim()
    if (!text.startsWith('+')) {
        return { iso: DEFAULT_COUNTRY, number: text.replace(/[^\d ]/g, '').trim() }
    }
    const digits = text.slice(1)
    const match = [...PHONE_COUNTRIES]
        .sort((a, b) => b.dial.length - a.dial.length)
        .find(c => digits.replace(/ /g, '').startsWith(c.dial) && digits.startsWith(c.dial))
    if (!match) return { iso: DEFAULT_COUNTRY, number: digits.replace(/[^\d ]/g, '').trim() }
    return { iso: match.iso, number: digits.slice(match.dial.length).replace(/[^\d ]/g, '').trim() }
}

export function joinPhone(iso, number) {
    const clean = String(number ?? '').replace(/[^\d ]/g, '').replace(/ {2,}/g, ' ').trim()
    if (!clean) return ''
    return `+${findCountry(iso).dial} ${clean}`
}

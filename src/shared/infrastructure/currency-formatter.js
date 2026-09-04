import { computed, reactive } from 'vue'

const BASE_CODE = 'PEN'
const PREFERENCE_KEY = 'vc.pref.currency'

const CATALOG = {
    PEN: { symbol: 'S/', penPerUnit: 1 },
    USD: { symbol: '$', penPerUnit: 3.75 }
}

export function isSupportedCurrency(value) {
    return Object.prototype.hasOwnProperty.call(CATALOG, value)
}

function readPreference() {
    try {
        const saved = localStorage.getItem(PREFERENCE_KEY)
        return isSupportedCurrency(saved) ? saved : BASE_CODE
    } catch {
        return BASE_CODE
    }
}

const state = reactive({ code: readPreference() })

export function setCurrency(value) {
    if (!isSupportedCurrency(value)) return
    state.code = value
    try {
        localStorage.setItem(PREFERENCE_KEY, value)
    } catch {}
}

function round2(amount) {
    return Math.round((Number(amount) || 0) * 100) / 100
}

export function useCurrencyFormatter() {
    const currency = computed(() => state.code)
    const symbol = computed(() => CATALOG[state.code].symbol)
    const rate = () => CATALOG[state.code].penPerUnit

    function format(amountInPen) {
        return `${CATALOG[state.code].symbol} ${round2((Number(amountInPen) || 0) / rate()).toFixed(2)}`
    }

    function fromBaseCurrency(amountInPen) {
        return round2((Number(amountInPen) || 0) / rate())
    }

    function toBaseCurrency(displayAmount) {
        return round2((Number(displayAmount) || 0) * rate())
    }

    return { currency, symbol, format, fromBaseCurrency, toBaseCurrency }
}

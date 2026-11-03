export const DAYS_PER_YEAR = 360
export const DAYS_PER_MONTH = 30
export const RATE_DECIMALS = 7

export function roundMoney(x) {
    return Math.round((Number(x) + Number.EPSILON) * 100) / 100
}

export function roundRate(x) {
    const factor = 10 ** RATE_DECIMALS
    return Math.round((Number(x) + Number.EPSILON) * factor) / factor
}

export function formatRate(rate) {
    return `${(Number(rate) * 100).toFixed(RATE_DECIMALS)}%`
}

export function daysBetween(from, to) {
    const a = from instanceof Date ? from : new Date(from)
    const b = to instanceof Date ? to : new Date(to)
    return Math.round((b - a) / 86_400_000)
}

export function effectiveRateForDays(rate, days) {
    const { type, value, periodDays = DAYS_PER_YEAR, capitalizationDays = DAYS_PER_MONTH } = rate
    const annual = type === 'nominal' ? roundRate(nominalToEffectiveAnnual(value * (DAYS_PER_YEAR / periodDays), capitalizationDays)) : value
    return Math.pow(1 + annual, days / DAYS_PER_YEAR) - 1
}

export function effectiveMonthlyRate(rate) {
    return effectiveRateForDays(rate, DAYS_PER_MONTH)
}

export function nominalToEffectiveAnnual(j, capitalizationDays = DAYS_PER_MONTH) {
    const periodic = j * (capitalizationDays / DAYS_PER_YEAR)
    return Math.pow(1 + periodic, DAYS_PER_YEAR / capitalizationDays) - 1
}

export function effectiveAnnualToNominal(effectiveAnnual, capitalizationDays = DAYS_PER_MONTH) {
    const m = DAYS_PER_YEAR / capitalizationDays
    return m * (Math.pow(1 + effectiveAnnual, 1 / m) - 1)
}

export function capitalizeGracePeriod(principal, rate, graceDays) {
    const graceRate = effectiveRateForDays(rate, graceDays)
    return {
        graceDays,
        graceRate: roundRate(graceRate),
        graceInterest: roundMoney(principal * graceRate),
        capitalizedDebt: roundMoney(principal * (1 + graceRate))
    }
}

export function frenchInstallment(principal, monthlyRate, months) {
    if (monthlyRate === 0) return principal / months
    return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))
}

export function frenchSchedule(principal, monthlyRate, months) {
    const installment = roundMoney(frenchInstallment(principal, monthlyRate, months))
    let balance = roundMoney(principal)
    const rows = []
    for (let period = 1; period <= months; period++) {
        const interest = roundMoney(balance * monthlyRate)
        const isLast = period === months
        const principalPaid = isLast ? balance : roundMoney(installment - interest)
        balance = roundMoney(balance - principalPaid)
        rows.push({
            period,
            installment: isLast ? roundMoney(principalPaid + interest) : installment,
            interest,
            principal: principalPaid,
            balance: Math.max(balance, 0)
        })
    }
    return { installment, monthlyRate: roundRate(monthlyRate), rows }
}

export function compensatoryInterest(principal, rate, days) {
    const i = roundRate(effectiveRateForDays(rate, days))
    return { days, rate: i, interest: roundMoney(principal * i) }
}

export function moratoriumInterest(overdueAmount, moratoriumRate, overdueDays) {
    if (overdueDays <= 0) return { overdueDays: 0, rate: 0, interest: 0 }
    const i = roundRate(effectiveRateForDays(moratoriumRate, overdueDays))
    return { overdueDays, rate: i, interest: roundMoney(overdueAmount * i) }
}

export function allocatePayment(amount, { lateFee = 0, interest = 0, principal = 0 }) {
    let remaining = amount
    const paidLateFee = Math.min(remaining, lateFee); remaining -= paidLateFee
    const paidInterest = Math.min(remaining, interest); remaining -= paidInterest
    const paidPrincipal = Math.min(remaining, principal); remaining -= paidPrincipal
    return {
        paidLateFee: roundMoney(paidLateFee),
        paidInterest: roundMoney(paidInterest),
        paidPrincipal: roundMoney(paidPrincipal),
        surplus: roundMoney(remaining),
        remainingLateFee: roundMoney(lateFee - paidLateFee),
        remainingInterest: roundMoney(interest - paidInterest),
        remainingPrincipal: roundMoney(principal - paidPrincipal)
    }
}

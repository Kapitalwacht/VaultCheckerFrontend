import {
    allocatePayment,
    capitalizeGracePeriod,
    compensatoryInterest,
    daysBetween,
    effectiveMonthlyRate,
    frenchSchedule,
    moratoriumInterest,
    roundMoney
} from '@/credit/domain/services/finance.js'

function lastDayOfMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate()
}

function dateAtDay(year, monthIndex, day) {
    const clamped = Math.min(day, lastDayOfMonth(year, monthIndex))
    return new Date(year, monthIndex, clamped)
}

function addMonths(date, months, day) {
    const target = new Date(date.getFullYear(), date.getMonth() + months, 1)
    return dateAtDay(target.getFullYear(), target.getMonth(), day)
}

function toIsoDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function parseLocalDate(value) {
    if (value instanceof Date) {
        return new Date(value.getFullYear(), value.getMonth(), value.getDate())
    }
    const [year, month, day] = String(value).slice(0, 10).split('-').map(Number)
    return new Date(year, (month || 1) - 1, day || 1)
}

export function resolveFirstPaymentDate(purchaseDate, cutoffDay, paymentDay) {
    const purchase = parseLocalDate(purchaseDate)
    const year = purchase.getFullYear()
    const month = purchase.getMonth()
    const cutoffDate = dateAtDay(year, month, cutoffDay)
    const baseMonth = purchase <= cutoffDate ? month : month + 1
    let paymentDate = dateAtDay(year, baseMonth, paymentDay)
    if (paymentDate <= purchase) {
        paymentDate = addMonths(paymentDate, 1, paymentDay)
    }
    return paymentDate
}

export function buildPaymentPlan(purchase, terms) {
    const principal = roundMoney(purchase.amount)
    const months = Number(purchase.months) || 1
    const paymentDay = Number(terms.paymentDay)
    const cutoffDay = Number(terms.cutoffDay)
    const purchaseDate = parseLocalDate(purchase.purchaseDate)

    const firstPaymentDate = resolveFirstPaymentDate(purchaseDate, cutoffDay, paymentDay)
    const graceDays = daysBetween(purchaseDate, firstPaymentDate)

    if (months <= 1) {
        const comp = compensatoryInterest(principal, terms.rate, graceDays)
        const total = roundMoney(principal + comp.interest)
        return {
            mode: 'single',
            purchaseDate: toIsoDate(purchaseDate),
            firstPaymentDate: toIsoDate(firstPaymentDate),
            graceDays,
            principal,
            capitalizedDebt: principal,
            compensatory: comp,
            installment: total,
            totalToPay: total,
            rows: [{
                period: 1,
                date: toIsoDate(firstPaymentDate),
                installment: total,
                interest: comp.interest,
                principal,
                balance: 0
            }]
        }
    }

    const grace = capitalizeGracePeriod(principal, terms.rate, graceDays)
    const monthlyRate = effectiveMonthlyRate(terms.rate)
    const schedule = frenchSchedule(grace.capitalizedDebt, monthlyRate, months)
    const rows = schedule.rows.map(row => ({
        ...row,
        date: toIsoDate(addMonths(firstPaymentDate, row.period, paymentDay))
    }))
    const totalToPay = roundMoney(schedule.installment * months)

    return {
        mode: 'installments',
        purchaseDate: toIsoDate(purchaseDate),
        firstPaymentDate: toIsoDate(firstPaymentDate),
        graceDays,
        principal,
        grace,
        monthlyRate: schedule.monthlyRate,
        capitalizedDebt: grace.capitalizedDebt,
        installment: schedule.installment,
        totalToPay,
        rows
    }
}

export function buildStatement(entries, referenceDate, moratoriumRate, isPaid) {
    const items = []
    for (const { purchase, plan } of entries) {
        for (const row of plan.rows) {
            if (isPaid(purchase.id, row.period)) continue
            const overdue = daysBetween(parseLocalDate(row.date), parseLocalDate(referenceDate)) > 0
            const lateFee = overdue
                ? settleInstallment(row, referenceDate, moratoriumRate).lateFee
                : 0
            items.push({
                purchaseId: purchase.id,
                description: purchase.description,
                period: row.period,
                dueDate: row.date,
                interest: row.interest,
                principal: row.principal,
                installment: row.installment,
                lateFee,
                overdue
            })
        }
    }
    items.sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0))
    return {
        items,
        totalInterest: roundMoney(items.reduce((sum, i) => sum + i.interest, 0)),
        totalLateFee: roundMoney(items.reduce((sum, i) => sum + i.lateFee, 0)),
        totalPrincipal: roundMoney(items.reduce((sum, i) => sum + i.principal, 0)),
        total: roundMoney(items.reduce((sum, i) => sum + i.installment + i.lateFee, 0))
    }
}

export function settleInstallment(row, paidDate, moratoriumRate) {
    const scheduledDate = parseLocalDate(row.date)
    const actualDate = parseLocalDate(paidDate)
    const overdueDays = Math.max(daysBetween(scheduledDate, actualDate), 0)
    const late = moratoriumInterest(row.installment, moratoriumRate, overdueDays)
    const total = roundMoney(row.installment + late.interest)
    const allocation = allocatePayment(total, {
        lateFee: late.interest,
        interest: row.interest,
        principal: row.principal
    })
    return {
        period: row.period,
        scheduledDate: row.date,
        paidDate: toIsoDate(actualDate),
        overdueDays,
        lateFee: late.interest,
        interest: row.interest,
        principal: row.principal,
        installment: row.installment,
        total,
        allocation
    }
}

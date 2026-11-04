export class CreditStatement {
    constructor({
        customerId = null,
        storeId = null,
        currency = null,
        cutoffDate = null,
        paymentDate = null,
        lines = [],
        lateFees = [],
        totalInterest = 0,
        totalPrincipal = 0,
        totalLateFee = 0,
        totalToPay = 0
    } = {}) {
        this.customerId = customerId
        this.storeId = storeId
        this.currency = currency
        this.cutoffDate = cutoffDate
        this.paymentDate = paymentDate
        this.lines = lines
        this.lateFees = lateFees
        this.totalInterest = totalInterest
        this.totalPrincipal = totalPrincipal
        this.totalLateFee = totalLateFee
        this.totalToPay = totalToPay
    }
}

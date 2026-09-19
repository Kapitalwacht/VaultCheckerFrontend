export class InstallmentPayment {
    constructor({
        id = null,
        paymentId = null,
        storeId = null,
        customerId = null,
        purchaseId = null,
        period = 1,
        scheduledDate = null,
        paidDate = null,
        installment = 0,
        lateFee = 0,
        interest = 0,
        principal = 0,
        total = 0,
        state = 'paid'
    } = {}) {
        this.id = id
        this.paymentId = paymentId
        this.storeId = storeId
        this.customerId = customerId
        this.purchaseId = purchaseId
        this.period = period
        this.scheduledDate = scheduledDate
        this.paidDate = paidDate
        this.installment = installment
        this.lateFee = lateFee
        this.interest = interest
        this.principal = principal
        this.total = total
        this.state = state
    }

    get hadLateFee() {
        return Number(this.lateFee) > 0
    }
}

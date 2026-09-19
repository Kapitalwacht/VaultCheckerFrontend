export class Invoice {
    constructor({
        id = null,
        invoiceId = null,
        storeId = null,
        planId = null,
        amount = 0,
        currency = 'PEN',
        status = 'paid',
        date = null
    } = {}) {
        this.id = id
        this.invoiceId = invoiceId
        this.storeId = storeId
        this.planId = planId
        this.amount = amount
        this.currency = currency
        this.status = status
        this.date = date
    }

    get isPaid() {
        return this.status === 'paid'
    }
}

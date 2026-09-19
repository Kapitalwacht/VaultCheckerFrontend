export class Purchase {
    constructor({
        id = null,
        purchaseId = null,
        storeId = null,
        customerId = null,
        productId = null,
        description = '',
        quantity = 1,
        amount = 0,
        purchaseDate = null,
        months = 1,
        state = 'active'
    } = {}) {
        this.id = id
        this.purchaseId = purchaseId
        this.storeId = storeId
        this.customerId = customerId
        this.productId = productId
        this.description = description
        this.quantity = quantity
        this.amount = amount
        this.purchaseDate = purchaseDate
        this.months = months
        this.state = state
    }

    get isSinglePayment() {
        return Number(this.months) <= 1
    }

    get isActive() {
        return this.state === 'active'
    }
}

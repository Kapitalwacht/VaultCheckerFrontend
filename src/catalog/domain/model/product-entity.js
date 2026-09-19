export class Product {
    constructor({
        id = null,
        productId = null,
        storeId = null,
        name = '',
        category = '',
        brand = '',
        unit = 'unit',
        cashPrice = 0,
        listPrice = 0,
        paymentMode = 'both',
        imageUrl = '',
        state = 'active'
    } = {}) {
        this.id = id
        this.productId = productId
        this.storeId = storeId
        this.name = name
        this.category = category
        this.brand = brand
        this.unit = unit
        this.cashPrice = cashPrice
        this.listPrice = listPrice
        this.paymentMode = paymentMode
        this.imageUrl = imageUrl
        this.state = state
    }

    get isActive() {
        return this.state === 'active'
    }

    get allowsInstallments() {
        return this.paymentMode === 'installments' || this.paymentMode === 'both'
    }

    get allowsSinglePayment() {
        return this.paymentMode === 'single' || this.paymentMode === 'both'
    }
}

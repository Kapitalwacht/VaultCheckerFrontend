export class Product {
    constructor({
        id = null,
        productId = null,
        storeId = null,
        name = '',
        category = '',
        unit = 'unit',
        price = 0,
        stock = 0,
        state = 'active'
    } = {}) {
        this.id = id
        this.productId = productId
        this.storeId = storeId
        this.name = name
        this.category = category
        this.unit = unit
        this.price = price
        this.stock = stock
        this.state = state
    }

    get isAvailable() {
        return this.state === 'active' && this.stock > 0
    }
}

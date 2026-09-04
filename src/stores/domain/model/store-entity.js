export class Store {
    constructor({
        id = null,
        storeId = null,
        ruc = '',
        businessName = '',
        category = '',
        address = '',
        phone = '',
        email = '',
        description = '',
        state = 'active'
    } = {}) {
        this.id = id
        this.storeId = storeId
        this.ruc = ruc
        this.businessName = businessName
        this.category = category
        this.address = address
        this.phone = phone
        this.email = email
        this.description = description
        this.state = state
    }

    get isActive() {
        return this.state === 'active'
    }
}

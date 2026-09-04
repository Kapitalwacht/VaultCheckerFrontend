export class Customer {
    constructor({
        id = null,
        customerId = null,
        storeId = null,
        firstName = '',
        lastName = '',
        dni = '',
        phone = '',
        address = '',
        creditLimit = 0,
        state = 'active'
    } = {}) {
        this.id = id
        this.customerId = customerId
        this.storeId = storeId
        this.firstName = firstName
        this.lastName = lastName
        this.dni = dni
        this.phone = phone
        this.address = address
        this.creditLimit = creditLimit
        this.state = state
    }

    get fullName() {
        return `${this.firstName} ${this.lastName}`.trim()
    }

    get isActive() {
        return this.state === 'active'
    }
}

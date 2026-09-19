export class AuthenticatedUser {
    constructor({
        id = null,
        userId = null,
        email = '',
        name = '',
        phone = '',
        role = 'store-admin',
        storeId = null,
        customerId = null,
        token = ''
    } = {}) {
        this.id = id
        this.userId = userId
        this.email = email
        this.name = name
        this.phone = phone
        this.role = role
        this.storeId = storeId
        this.customerId = customerId
        this.token = token
    }

    get isAuthenticated() {
        return Boolean(this.token)
    }

    get isSystemAdmin() {
        return this.role === 'system-admin'
    }

    get isStoreAdmin() {
        return this.role === 'store-admin'
    }

    get isCustomer() {
        return this.role === 'customer'
    }
}

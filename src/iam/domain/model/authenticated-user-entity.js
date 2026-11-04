import { Roles } from '@/iam/domain/model/roles.js'

export class AuthenticatedUser {
    constructor({
        id = null,
        userId = null,
        email = '',
        name = '',
        phone = '',
        role = Roles.STORE_ADMIN,
        storeId = null,
        customerId = null,
        token = '',
        refreshToken = ''
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
        this.refreshToken = refreshToken
    }

    get isAuthenticated() {
        return Boolean(this.token)
    }

    get isSystemAdmin() {
        return this.role === Roles.SYSTEM_ADMIN
    }

    get isStoreAdmin() {
        return this.role === Roles.STORE_ADMIN
    }

    get isCustomer() {
        return this.role === Roles.CUSTOMER
    }
}

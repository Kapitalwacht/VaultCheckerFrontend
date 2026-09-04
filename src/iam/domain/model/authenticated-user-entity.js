export class AuthenticatedUser {
    constructor({
        id = null,
        userId = null,
        email = '',
        role = 'seller',
        token = ''
    } = {}) {
        this.id = id
        this.userId = userId
        this.email = email
        this.role = role
        this.token = token
    }

    get isAuthenticated() {
        return Boolean(this.token)
    }
}

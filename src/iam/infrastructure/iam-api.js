import { BaseApi } from '@/shared/infrastructure/base-api.js'
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js'
import { AuthenticatedUserAssembler } from '@/iam/infrastructure/authenticated-user.assembler.js'

const usersPath = '/users'

function toAuthenticatedUser(record) {
    return AuthenticatedUserAssembler.toEntityFromResource({
        id: record.id,
        userId: record.userId,
        email: record.email,
        name: record.name,
        role: record.role,
        storeId: record.storeId,
        customerId: record.customerId,
        token: `token-${record.id}`
    })
}

export class IamApi extends BaseApi {
    #usersEndpoint

    constructor() {
        super()
        this.#usersEndpoint = new BaseEndpoint(this, usersPath)
    }

    findByEmail(email) {
        return this.http
            .get(`${usersPath}?email=${encodeURIComponent(email)}`)
            .then(response => (response.data || [])[0] || null)
    }

    patchUser(id, patch) {
        return this.http.patch(`${usersPath}/${id}`, patch).then(response => response.data)
    }

    signIn(credentials) {
        return this.findByEmail(credentials.email).then(record => {
            if (!record || record.password !== credentials.password) {
                throw new Error('invalid-credentials')
            }
            return toAuthenticatedUser(record)
        })
    }

    signInWithGoogleRecord(record) {
        return toAuthenticatedUser(record)
    }

    signUp(registration) {
        return this.#usersEndpoint.create(registration).then(response => response.data)
    }
}

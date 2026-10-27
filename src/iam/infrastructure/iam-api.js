import { BaseApi } from '@/shared/infrastructure/base-api.js'
import { AuthenticatedUserAssembler } from '@/iam/infrastructure/authenticated-user.assembler.js'

const usersPath = '/users'
const currentUserPath = `${usersPath}/me`
const authenticationPath = import.meta.env.VITE_AUTH_ENDPOINT_PATH ?? '/authentication'

function toAuthenticatedUser(record) {
    return AuthenticatedUserAssembler.toEntityFromResource({
        id: record.id,
        userId: record.userId,
        email: record.email,
        name: record.name,
        phone: record.phone,
        role: record.role,
        storeId: record.storeId,
        customerId: record.customerId,
        token: `token-${record.id}`
    })
}

function failWith(errorsByStatus) {
    return error => {
        throw new Error(errorsByStatus[error.response?.status] ?? 'generic')
    }
}

export class IamApi extends BaseApi {
    findByEmail(email) {
        return this.http
            .get(`${usersPath}?email=${encodeURIComponent(email)}`)
            .then(response => (response.data || [])[0] || null)
    }

    signIn(credentials) {
        return this.http
            .post(`${authenticationPath}/sign-in`, {
                email: credentials.email,
                password: credentials.password
            })
            .then(response => AuthenticatedUserAssembler.toEntityFromResource(response.data))
            .catch(failWith({ 400: 'invalid-credentials', 404: 'invalid-credentials' }))
    }

    signInWithGoogleRecord(record) {
        return toAuthenticatedUser(record)
    }

    signUp(registration) {
        return this.http
            .post(`${authenticationPath}/sign-up`, {
                email: registration.email,
                password: registration.password,
                role: registration.role,
                name: registration.name,
                phone: registration.phone,
                storeId: registration.storeId
            })
            .then(response => response.data)
            .catch(failWith({ 409: 'email-taken' }))
    }

    verifyEmail(email, token) {
        return this.http
            .post(`${authenticationPath}/verify-email`, { email, token })
            .then(response => response.data)
            .catch(failWith({ 400: 'invalid-token' }))
    }

    requestRecovery(email) {
        return this.http
            .post(`${authenticationPath}/password-recovery`, { email })
            .catch(failWith({ 404: 'email-not-found', 503: 'email-unavailable' }))
    }

    resetPassword(email, code, newPassword) {
        return this.http
            .post(`${authenticationPath}/password-reset`, { email, code, newPassword })
            .catch(failWith({ 400: 'invalid-code', 422: 'code-expired' }))
    }

    requestPhoneCode(phone) {
        return this.http
            .post(`${authenticationPath}/phone-code`, { phone })
            .then(response => response.data.code)
            .catch(failWith({ 404: 'phone-not-found' }))
    }

    signInWithPhone(phone, code) {
        return this.http
            .post(`${authenticationPath}/phone-sign-in`, { phone, code })
            .then(response => AuthenticatedUserAssembler.toEntityFromResource(response.data))
            .catch(failWith({ 400: 'invalid-code', 404: 'phone-not-found', 422: 'code-expired' }))
    }

    updateProfile({ name, phone }) {
        return this.http
            .put(currentUserPath, { name, phone })
            .then(response => response.data)
            .catch(failWith({ 401: 'not-authenticated' }))
    }

    changeEmail(email) {
        return this.http
            .put(`${currentUserPath}/email`, { email })
            .then(response => AuthenticatedUserAssembler.toEntityFromResource(response.data))
            .catch(failWith({ 401: 'not-authenticated', 409: 'email-taken', 503: 'email-unavailable' }))
    }

    changePassword(currentPassword, newPassword) {
        return this.http
            .put(`${currentUserPath}/password`, { currentPassword, newPassword })
            .catch(failWith({ 400: 'wrong-current-password', 401: 'not-authenticated' }))
    }
}

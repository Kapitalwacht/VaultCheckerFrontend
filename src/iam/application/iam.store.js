import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { IamApi } from '@/iam/infrastructure/iam-api.js'
import { AuthenticatedUser } from '@/iam/domain/model/authenticated-user-entity.js'
import { sendRecoveryEmail } from '@/iam/infrastructure/email-service.js'

const RECOVERY_TTL_MS = 15 * 60 * 1000

function generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000))
}

const STORAGE_KEY = 'vaultchecker-auth'

const iamApi = new IamApi()

function restoreSession() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? new AuthenticatedUser(JSON.parse(raw)) : null
    } catch {
        return null
    }
}

const useIamStore = defineStore('iam', () => {
    const currentUser = ref(restoreSession())

    const isAuthenticated = computed(() => currentUser.value?.isAuthenticated ?? false)
    const role = computed(() => currentUser.value?.role ?? null)
    const storeId = computed(() => currentUser.value?.storeId ?? null)
    const customerId = computed(() => currentUser.value?.customerId ?? null)
    const token = computed(() => currentUser.value?.token ?? null)
    const isSystemAdmin = computed(() => currentUser.value?.isSystemAdmin ?? false)

    function persist(user) {
        currentUser.value = user
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
        } catch {}
    }

    function signIn(credentials) {
        return iamApi.signIn(credentials).then(user => {
            persist(user)
            return user
        })
    }

    function register(registration) {
        return iamApi.signUp(registration).then(() => signIn({
            email: registration.email,
            password: registration.password
        }))
    }

    function signInWithGoogle(profile) {
        return iamApi.findByEmail(profile.email).then(record => {
            if (!record) throw new Error('google-no-account')
            const user = iamApi.signInWithGoogleRecord(record)
            persist(user)
            return user
        })
    }

    function requestRecovery(email) {
        return iamApi.findByEmail(email).then(record => {
            if (!record) throw new Error('email-not-found')
            const code = generateCode()
            const expiresAt = Date.now() + RECOVERY_TTL_MS
            return iamApi.patchUser(record.id, { recoveryCode: code, recoveryExpiresAt: expiresAt })
                .then(() => sendRecoveryEmail({ email: record.email, name: record.name, code }))
                .then(result => ({ emailSent: result.sent, code: result.sent ? null : code }))
        })
    }

    function resetPassword(email, code, newPassword) {
        return iamApi.findByEmail(email).then(record => {
            if (!record || !record.recoveryCode) throw new Error('invalid-code')
            if (String(record.recoveryCode) !== String(code).trim()) throw new Error('invalid-code')
            if (record.recoveryExpiresAt && Date.now() > record.recoveryExpiresAt) throw new Error('code-expired')
            return iamApi.patchUser(record.id, {
                password: newPassword,
                recoveryCode: null,
                recoveryExpiresAt: null
            }).then(() => true)
        })
    }

    function updateProfile({ name, email }) {
        const id = currentUser.value?.id
        if (!id) return Promise.reject(new Error('not-authenticated'))
        return iamApi.patchUser(id, { name, email }).then(() => {
            const updated = new AuthenticatedUser({
                id: currentUser.value.id,
                userId: currentUser.value.userId,
                email,
                name,
                role: currentUser.value.role,
                storeId: currentUser.value.storeId,
                customerId: currentUser.value.customerId,
                token: currentUser.value.token
            })
            persist(updated)
            return updated
        })
    }

    function changePassword(currentPassword, newPassword) {
        const id = currentUser.value?.id
        if (!id) return Promise.reject(new Error('not-authenticated'))
        return iamApi.findByEmail(currentUser.value.email).then(record => {
            if (!record || record.password !== currentPassword) {
                throw new Error('wrong-current-password')
            }
            return iamApi.patchUser(id, { password: newPassword }).then(() => true)
        })
    }

    function logout() {
        currentUser.value = null
        try {
            localStorage.removeItem(STORAGE_KEY)
        } catch {}
    }

    return {
        currentUser, isAuthenticated, role, storeId, customerId, token, isSystemAdmin,
        signIn, signInWithGoogle, register, requestRecovery, resetPassword,
        updateProfile, changePassword, logout
    }
})

export default useIamStore

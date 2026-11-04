import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { IamApi } from '@/iam/infrastructure/iam-api.js'
import { AuthenticatedUser } from '@/iam/domain/model/authenticated-user-entity.js'
import { Store } from '@/stores/domain/model/store-entity.js'
import { Roles } from '@/iam/domain/model/roles.js'
import useAuditStore from '@/audit/application/audit.store.js'

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

    function registerAccount({ role, businessName, category, ruc, ownerName, email, phone, password }) {
        const isCustomer = role === Roles.CUSTOMER
        return iamApi.signUp({
            email,
            password,
            name: ownerName,
            phone,
            role,
            storeId: isCustomer ? null : Store.generateCode(),
            businessName: isCustomer ? null : businessName,
            ruc: isCustomer ? null : ruc,
            category: isCustomer ? null : category
        }).then(() => ({ signedIn: false, emailSent: true, link: '' }))
    }

    function resendVerification(email) {
        return iamApi.resendVerification(email)
    }

    function createStoreAdmin({ name, email, phone, password, storeId }) {
        return iamApi.signUp({ email, password, name, phone, role: Roles.STORE_ADMIN, storeId })
    }

    function verifyEmail(email, token) {
        return iamApi.verifyEmail(email, token.trim()).then(user => user.name || null)
    }

    function signInWithGoogle(profile) {
        return iamApi.signInWithGoogle(profile.accessToken).then(user => {
            persist(user)
            return user
        })
    }

    function requestRecovery(email) {
        return iamApi.requestRecovery(email).then(() => ({ emailSent: true, code: null }))
    }

    function verifyRecoveryCode(email, code) {
        return iamApi.verifyRecoveryCode(email, code.trim()).then(() => true)
    }

    function resetPassword(email, code, newPassword) {
        return iamApi.resetPassword(email, code.trim(), newPassword).then(() => true)
    }

    function rebuildSession(changes) {
        const session = restoreSession() ?? currentUser.value
        const updated = new AuthenticatedUser({
            id: currentUser.value.id,
            userId: currentUser.value.userId,
            email: changes.email ?? currentUser.value.email,
            name: changes.name ?? currentUser.value.name,
            phone: changes.phone ?? currentUser.value.phone,
            role: currentUser.value.role,
            storeId: currentUser.value.storeId,
            customerId: currentUser.value.customerId,
            token: session.token,
            refreshToken: session.refreshToken
        })
        persist(updated)
        return updated
    }

    function updateProfile({ name, phone }) {
        const id = currentUser.value?.id
        if (!id) return Promise.reject(new Error('not-authenticated'))
        return iamApi.updateProfile({ name, phone }).then(() => {
            useAuditStore().recordAction('UPDATE_PROFILE', `Profile of ${currentUser.value.email} updated`)
            return rebuildSession({ name, phone })
        })
    }

    function changeEmail(newEmail) {
        const id = currentUser.value?.id
        if (!id) return Promise.reject(new Error('not-authenticated'))
        const email = newEmail.trim()
        return iamApi.changeEmail(email).then(user => {
            persist(user)
            useAuditStore().recordAction('CHANGE_EMAIL', `Account email changed to ${email}`)
            return { emailSent: true, link: null }
        })
    }

    function changePassword(currentPassword, newPassword) {
        const id = currentUser.value?.id
        if (!id) return Promise.reject(new Error('not-authenticated'))
        return iamApi.changePassword(currentPassword, newPassword).then(() => {
            useAuditStore().recordAction('CHANGE_PASSWORD', `Password of ${currentUser.value.email} changed`)
            return true
        })
    }

    function logout() {
        const refreshToken = restoreSession()?.refreshToken
        if (refreshToken) iamApi.signOut(refreshToken).catch(() => {})
        currentUser.value = null
        try {
            localStorage.removeItem(STORAGE_KEY)
        } catch {}
    }

    return {
        currentUser, isAuthenticated, role, storeId, customerId, token, isSystemAdmin,
        signIn, signInWithGoogle, registerAccount, resendVerification, createStoreAdmin, verifyEmail,
        requestRecovery, verifyRecoveryCode, resetPassword, updateProfile, changeEmail, changePassword, logout
    }
})

export default useIamStore

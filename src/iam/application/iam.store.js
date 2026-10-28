import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { IamApi } from '@/iam/infrastructure/iam-api.js'
import { AuthenticatedUser } from '@/iam/domain/model/authenticated-user-entity.js'
import { StoresApi } from '@/stores/infrastructure/stores-api.js'
import { StoreAssembler } from '@/stores/infrastructure/store.assembler.js'
import { Store } from '@/stores/domain/model/store-entity.js'
import useAuditStore from '@/audit/application/audit.store.js'

const STORAGE_KEY = 'vaultchecker-auth'

const iamApi = new IamApi()
const storesApi = new StoresApi()

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

    function registerAccount({ businessName, category, ruc, ownerName, email, phone, password }) {
        const storeCode = `ST-${Date.now().toString(36).toUpperCase()}`
        const storeResource = StoreAssembler.toResourceFromEntity(new Store({
            storeId: storeCode,
            ruc,
            businessName,
            category,
            phone,
            email
        }))
        return iamApi.signUp({
            email,
            password,
            name: ownerName,
            phone,
            role: 'store-admin',
            storeId: storeCode
        })
            .then(() => signIn({ email, password }))
            .then(() => storesApi.createStore(storeResource))
            .then(() => {
                useAuditStore().recordAction('REGISTER_ACCOUNT', `Account ${email} created for ${businessName}`)
                return { signedIn: true }
            })
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

    let issuedPhoneCode = null

    function requestLoginCode(phone) {
        return iamApi.requestPhoneCode(phone).then(code => {
            issuedPhoneCode = code
            return { smsSent: true }
        })
    }

    function signInWithPhone(phone, code) {
        if (!/^\d{6}$/.test(code.trim())) return Promise.reject(new Error('invalid-code'))
        return iamApi.signInWithPhone(phone, issuedPhoneCode ?? code.trim()).then(user => {
            issuedPhoneCode = null
            persist(user)
            return user
        })
    }

    function requestRecovery(email) {
        return iamApi.requestRecovery(email).then(() => ({ emailSent: true, code: null }))
    }

    function resetPassword(email, code, newPassword) {
        return iamApi.resetPassword(email, code.trim(), newPassword).then(() => true)
    }

    function rebuildSession(changes) {
        const updated = new AuthenticatedUser({
            id: currentUser.value.id,
            userId: currentUser.value.userId,
            email: changes.email ?? currentUser.value.email,
            name: changes.name ?? currentUser.value.name,
            phone: changes.phone ?? currentUser.value.phone,
            role: currentUser.value.role,
            storeId: currentUser.value.storeId,
            customerId: currentUser.value.customerId,
            token: currentUser.value.token
        })
        persist(updated)
        return updated
    }

    function updateProfile({ name, phone }) {
        const id = currentUser.value?.id
        if (!id) return Promise.reject(new Error('not-authenticated'))
        return iamApi.updateProfile({ name, phone }).then(() => rebuildSession({ name, phone }))
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
        return iamApi.changePassword(currentPassword, newPassword).then(() => true)
    }

    function logout() {
        currentUser.value = null
        try {
            localStorage.removeItem(STORAGE_KEY)
        } catch {}
    }

    return {
        currentUser, isAuthenticated, role, storeId, customerId, token, isSystemAdmin,
        signIn, signInWithGoogle, requestLoginCode, signInWithPhone, registerAccount, verifyEmail,
        requestRecovery, resetPassword, updateProfile, changeEmail, changePassword, logout
    }
})

export default useIamStore

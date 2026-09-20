import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { IamApi } from '@/iam/infrastructure/iam-api.js'
import { AuthenticatedUser } from '@/iam/domain/model/authenticated-user-entity.js'
import { sendRecoveryEmail, sendVerificationEmail } from '@/iam/infrastructure/email-service.js'
import { sendLoginCodeSms } from '@/iam/infrastructure/sms-service.js'
import { isFirebasePhoneConfigured, sendPhoneCode, confirmPhoneCode } from '@/iam/infrastructure/firebase-phone.js'
import { StoresApi } from '@/stores/infrastructure/stores-api.js'
import { StoreAssembler } from '@/stores/infrastructure/store.assembler.js'
import { Store } from '@/stores/domain/model/store-entity.js'
import useAuditStore from '@/audit/application/audit.store.js'

const RECOVERY_TTL_MS = 15 * 60 * 1000
const LOGIN_CODE_TTL_MS = 5 * 60 * 1000

function generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000))
}

function generateToken() {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`
}

function buildVerificationLink(token, email) {
    const base = `${window.location.origin}/verify`
    return `${base}?token=${token}&email=${encodeURIComponent(email)}`
}

function nextCode(items, prefix, field) {
    const highest = items.reduce((acc, item) => {
        const match = String(item?.[field] ?? '').match(/(\d+)$/)
        const value = match ? Number(match[1]) : 0
        return value > acc ? value : acc
    }, 0)
    return `${prefix}-${String(highest + 1).padStart(3, '0')}`
}

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
    const phoneCodeMode = ref('demo')

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

    function registerAccount({ businessName, category, ruc, ownerName, email, phone, password }) {
        return iamApi.findByEmail(email).then(existing => {
            if (existing) throw new Error('email-taken')
            return Promise.all([storesApi.getAllStores(), iamApi.listUsers()])
        }).then(([storesResponse, usersResponse]) => {
            const storeCode = nextCode(storesResponse.data || [], 'ST', 'storeId')
            const userCode = nextCode(usersResponse.data || [], 'US', 'userId')
            const verificationToken = generateToken()
            const storeResource = StoreAssembler.toResourceFromEntity(new Store({
                storeId: storeCode,
                ruc,
                businessName,
                category,
                phone,
                email
            }))
            return storesApi.createStore(storeResource).then(() => {
                useAuditStore().recordAction('CREATE_STORE', `Store ${businessName} registered`)
                return iamApi.signUp({
                    userId: userCode,
                    email,
                    password,
                    name: ownerName,
                    phone,
                    role: 'store-admin',
                    storeId: storeCode,
                    emailVerified: false,
                    verificationToken,
                    recoveryCode: null,
                    recoveryExpiresAt: null
                })
            }).then(() => {
                useAuditStore().recordAction('REGISTER_ACCOUNT', `Account ${email} created for ${businessName}`)
                const link = buildVerificationLink(verificationToken, email)
                return sendVerificationEmail({ email, name: ownerName, link })
                    .then(result => ({ emailSent: result.sent, link: result.sent ? null : link }))
            })
        })
    }

    function verifyEmail(email, token) {
        return iamApi.findByEmail(email).then(record => {
            if (!record || !record.verificationToken) throw new Error('invalid-token')
            if (String(record.verificationToken) !== String(token).trim()) throw new Error('invalid-token')
            return iamApi.patchUser(record.id, {
                emailVerified: true,
                verificationToken: null
            }).then(() => record.name || null)
        })
    }

    function signInWithGoogle(profile) {
        return iamApi.findByEmail(profile.email).then(record => {
            if (!record) throw new Error('google-no-account')
            const user = iamApi.signInWithGoogleRecord(record)
            persist(user)
            return user
        })
    }

    function issueDemoLoginCode(record) {
        const code = generateCode()
        const expiresAt = Date.now() + LOGIN_CODE_TTL_MS
        return iamApi.patchUser(record.id, { loginCode: code, loginCodeExpiresAt: expiresAt })
            .then(() => sendLoginCodeSms({ phone: record.phone, name: record.name, code }))
            .then(result => ({ smsSent: result.sent, code: result.sent ? null : code }))
    }

    function requestLoginCode(phone) {
        return iamApi.findByPhone(phone).then(record => {
            if (!record) throw new Error('phone-not-found')
            if (isFirebasePhoneConfigured()) {
                return sendPhoneCode(record.phone)
                    .then(() => {
                        phoneCodeMode.value = 'firebase'
                        return { smsSent: true, code: null }
                    })
                    .catch(() => {
                        phoneCodeMode.value = 'demo'
                        return issueDemoLoginCode(record)
                    })
            }
            phoneCodeMode.value = 'demo'
            return issueDemoLoginCode(record)
        })
    }

    function signInWithPhone(phone, code) {
        return iamApi.findByPhone(phone).then(record => {
            if (!record) throw new Error('phone-not-found')
            if (isFirebasePhoneConfigured() && phoneCodeMode.value === 'firebase') {
                return confirmPhoneCode(code)
                    .catch(() => { throw new Error('invalid-code') })
                    .then(() => {
                        const user = iamApi.signInWithGoogleRecord(record)
                        persist(user)
                        return user
                    })
            }
            if (!record.loginCode) throw new Error('invalid-code')
            if (String(record.loginCode) !== String(code).trim()) throw new Error('invalid-code')
            if (record.loginCodeExpiresAt && Date.now() > record.loginCodeExpiresAt) throw new Error('code-expired')
            return iamApi.patchUser(record.id, { loginCode: null, loginCodeExpiresAt: null }).then(() => {
                const user = iamApi.signInWithGoogleRecord(record)
                persist(user)
                return user
            })
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
        return iamApi.patchUser(id, { name, phone }).then(() => rebuildSession({ name, phone }))
    }

    function changeEmail(newEmail) {
        const id = currentUser.value?.id
        if (!id) return Promise.reject(new Error('not-authenticated'))
        const email = newEmail.trim()
        return iamApi.findByEmail(email).then(existing => {
            if (existing && existing.id !== id) throw new Error('email-taken')
            const verificationToken = generateToken()
            return iamApi.patchUser(id, {
                email,
                emailVerified: false,
                verificationToken
            }).then(() => {
                rebuildSession({ email })
                useAuditStore().recordAction('CHANGE_EMAIL', `Account email changed to ${email}`)
                const link = buildVerificationLink(verificationToken, email)
                return sendVerificationEmail({ email, name: currentUser.value.name, link })
                    .then(result => ({ emailSent: result.sent, link: result.sent ? null : link }))
            })
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
        signIn, signInWithGoogle, requestLoginCode, signInWithPhone, register, registerAccount, verifyEmail,
        requestRecovery, resetPassword, updateProfile, changeEmail, changePassword, logout
    }
})

export default useIamStore

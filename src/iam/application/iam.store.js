import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { IamApi } from '@/iam/infrastructure/iam-api.js'
import { AuthenticatedUser } from '@/iam/domain/model/authenticated-user-entity.js'

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
    const token = computed(() => currentUser.value?.token ?? null)

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

    function logout() {
        currentUser.value = null
        try {
            localStorage.removeItem(STORAGE_KEY)
        } catch {}
    }

    return { currentUser, isAuthenticated, role, token, signIn, register, logout }
})

export default useIamStore

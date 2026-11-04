import axios from 'axios'

const AUTH_STORAGE_KEY = 'vaultchecker-auth'
const DEFAULT_BASE_URL = 'http://localhost:3000/api/v1'

const LOGIN_PATH = '/login'
const UNAUTHORIZED = 401

const authSegment = import.meta.env.VITE_AUTH_ENDPOINT_PATH ?? '/authentication'
const refreshPath = `${authSegment}/refresh`

function currentToken() {
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY)
        return raw ? (JSON.parse(raw).token ?? null) : null
    } catch {
        return null
    }
}

let refreshing = null

function storedSession() {
    try {
        return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY))
    } catch {
        return null
    }
}

async function renewSession(client) {
    const session = storedSession()
    const { data } = await client.post(refreshPath, { refreshToken: session?.refreshToken })
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        ...session,
        token: data.token,
        refreshToken: data.refreshToken
    }))
}

function endSession() {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    window.location.assign(LOGIN_PATH)
}

function retryAfterRefresh(client) {
    return error => {
        const { config, response } = error
        const goesToAuth = (config?.url ?? '').includes(`${authSegment}/`)
        if (response?.status !== UNAUTHORIZED || config.retried || goesToAuth) return Promise.reject(error)
        config.retried = true
        refreshing ??= renewSession(client).finally(() => { refreshing = null })
        return refreshing.then(
            () => client(config),
            () => {
                endSession()
                return Promise.reject(error)
            }
        )
    }
}

function attachAuthHeader(config) {
    const goesToAuth = (config.url ?? '').includes(`${authSegment}/`)
    const token = currentToken()
    if (token && !goesToAuth) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
}

export class BaseApi {
    #client

    constructor() {
        this.#client = axios.create({
            baseURL: import.meta.env.VITE_VAULTCHECKER_PLATFORM_API_URL ?? DEFAULT_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        })

        this.#client.interceptors.request.use(attachAuthHeader)
        this.#client.interceptors.response.use(response => response, retryAfterRefresh(this.#client))
    }

    get http() {
        return this.#client
    }
}

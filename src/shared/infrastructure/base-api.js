import axios from 'axios'

const AUTH_STORAGE_KEY = 'vaultchecker-auth'
const DEFAULT_BASE_URL = 'http://localhost:3000/api/v1'

const authSegment = import.meta.env.VITE_AUTH_ENDPOINT_PATH ?? '/authentication'

function currentToken() {
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY)
        return raw ? (JSON.parse(raw).token ?? null) : null
    } catch {
        return null
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
    }

    get http() {
        return this.#client
    }
}

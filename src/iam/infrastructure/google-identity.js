const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

let scriptPromise = null

export function isGoogleConfigured() {
    return Boolean(CLIENT_ID)
}

function loadScript() {
    if (window.google?.accounts?.oauth2) return Promise.resolve()
    if (scriptPromise) return scriptPromise
    scriptPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = SCRIPT_SRC
        script.async = true
        script.defer = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('google-script-failed'))
        document.head.appendChild(script)
    })
    return scriptPromise
}

export async function signInWithGoogle() {
    if (!isGoogleConfigured()) throw new Error('google-not-configured')
    await loadScript()
    const accessToken = await new Promise((resolve, reject) => {
        const client = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: 'openid email profile',
            callback: response => {
                if (response.error) reject(new Error('google-cancelled'))
                else resolve(response.access_token)
            }
        })
        client.requestAccessToken()
    })
    const info = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
    }).then(response => response.json())
    return { email: info.email, name: info.name, sub: info.sub }
}

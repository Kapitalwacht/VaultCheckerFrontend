const SMS_ENDPOINT = import.meta.env.VITE_SMS_ENDPOINT

export function isSmsConfigured() {
    return Boolean(SMS_ENDPOINT)
}

export function sendLoginCodeSms({ phone, name, code }) {
    if (!isSmsConfigured()) {
        return Promise.resolve({ sent: false })
    }
    return fetch(SMS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name: name || phone, code })
    }).then(response => {
        if (!response.ok) throw new Error('sms-send-failed')
        return { sent: true }
    })
}

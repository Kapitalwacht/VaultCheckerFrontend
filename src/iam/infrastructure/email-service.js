const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID

export function isEmailConfigured() {
    return Boolean(PUBLIC_KEY && SERVICE_ID && TEMPLATE_ID)
}

export function sendRecoveryEmail({ email, name, code }) {
    if (!isEmailConfigured()) {
        return Promise.resolve({ sent: false })
    }
    return fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            service_id: SERVICE_ID,
            template_id: TEMPLATE_ID,
            user_id: PUBLIC_KEY,
            template_params: { email, to_email: email, name: name || email, code }
        })
    }).then(response => {
        if (!response.ok) throw new Error('email-send-failed')
        return { sent: true }
    })
}

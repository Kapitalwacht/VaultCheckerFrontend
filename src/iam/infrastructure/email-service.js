const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const VERIFICATION_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_VERIFICATION_TEMPLATE_ID

export function isEmailConfigured() {
    return Boolean(PUBLIC_KEY && SERVICE_ID && TEMPLATE_ID)
}

export function isVerificationEmailConfigured() {
    return Boolean(PUBLIC_KEY && SERVICE_ID && VERIFICATION_TEMPLATE_ID)
}

function sendEmail(templateId, templateParams) {
    return fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            service_id: SERVICE_ID,
            template_id: templateId,
            user_id: PUBLIC_KEY,
            template_params: templateParams
        })
    }).then(response => {
        if (!response.ok) throw new Error('email-send-failed')
        return { sent: true }
    })
}

export function sendRecoveryEmail({ email, name, code }) {
    if (!isEmailConfigured()) {
        return Promise.resolve({ sent: false })
    }
    return sendEmail(TEMPLATE_ID, { email, to_email: email, name: name || email, code })
}

export function sendVerificationEmail({ email, name, link }) {
    if (!isVerificationEmailConfigured()) {
        return Promise.resolve({ sent: false })
    }
    return sendEmail(VERIFICATION_TEMPLATE_ID, { email, to_email: email, name: name || email, link })
}

const PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

export function isStripeConfigured() {
    return Boolean(PUBLISHABLE_KEY)
}

export function startCheckout(plan) {
    if (plan?.stripePaymentLink) {
        window.location.href = plan.stripePaymentLink
        return { redirected: true }
    }
    return { redirected: false }
}

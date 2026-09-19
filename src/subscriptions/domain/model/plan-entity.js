export class Plan {
    constructor({
        id = null,
        planId = null,
        name = '',
        priceMonthly = 0,
        currency = 'PEN',
        features = [],
        stripePaymentLink = '',
        highlighted = false
    } = {}) {
        this.id = id
        this.planId = planId
        this.name = name
        this.priceMonthly = priceMonthly
        this.currency = currency
        this.features = features
        this.stripePaymentLink = stripePaymentLink
        this.highlighted = highlighted
    }

    get isFree() {
        return this.priceMonthly === 0
    }
}

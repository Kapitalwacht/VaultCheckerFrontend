export class Subscription {
    constructor({
        id = null,
        subscriptionId = null,
        storeId = null,
        planId = null,
        status = 'active',
        currentPeriodEnd = null,
        stripeCustomerId = null
    } = {}) {
        this.id = id
        this.subscriptionId = subscriptionId
        this.storeId = storeId
        this.planId = planId
        this.status = status
        this.currentPeriodEnd = currentPeriodEnd
        this.stripeCustomerId = stripeCustomerId
    }

    get isActive() {
        return this.status === 'active'
    }

    get isPastDue() {
        return this.status === 'past_due'
    }
}

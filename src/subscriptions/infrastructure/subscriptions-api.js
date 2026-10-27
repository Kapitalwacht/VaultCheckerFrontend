import { BaseApi } from '@/shared/infrastructure/base-api.js'
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js'

const plansPath = '/plans'
const subscriptionsPath = '/subscriptions'
const invoicesPath = '/invoices'

export class SubscriptionsApi extends BaseApi {
    #plansEndpoint

    constructor() {
        super()
        this.#plansEndpoint = new BaseEndpoint(this, plansPath)
    }

    getPlans() {
        return this.#plansEndpoint.getAll()
    }

    getSubscriptionByStore(storeId) {
        return this.http.get(`${subscriptionsPath}?storeId=${encodeURIComponent(storeId)}`)
    }

    getInvoicesByStore(storeId) {
        return this.http.get(`${invoicesPath}?storeId=${encodeURIComponent(storeId)}`)
    }

    changePlan(storeId, planId) {
        return this.http.post(subscriptionsPath, { storeId, planId })
    }
}

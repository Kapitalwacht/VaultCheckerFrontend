import { BaseApi } from '@/shared/infrastructure/base-api.js'
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js'

const plansPath = '/plans'
const subscriptionsPath = '/subscriptions'
const invoicesPath = '/invoices'

export class SubscriptionsApi extends BaseApi {
    #plansEndpoint
    #subscriptionsEndpoint
    #invoicesEndpoint

    constructor() {
        super()
        this.#plansEndpoint = new BaseEndpoint(this, plansPath)
        this.#subscriptionsEndpoint = new BaseEndpoint(this, subscriptionsPath)
        this.#invoicesEndpoint = new BaseEndpoint(this, invoicesPath)
    }

    getPlans() {
        return this.#plansEndpoint.getAll()
    }

    getSubscriptionByStore(storeId) {
        return this.http.get(`${subscriptionsPath}?storeId=${encodeURIComponent(storeId)}`)
    }

    getInvoicesByStore(storeId) {
        return this.http.get(`${invoicesPath}?storeId=${encodeURIComponent(storeId)}&_sort=date&_order=desc`)
    }

    createSubscription(resource) {
        return this.#subscriptionsEndpoint.create(resource)
    }

    updateSubscription(id, resource) {
        return this.#subscriptionsEndpoint.update(id, resource)
    }

    createInvoice(resource) {
        return this.#invoicesEndpoint.create(resource)
    }
}

import { BaseApi } from '@/shared/infrastructure/base-api.js'
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js'

const customersPath = '/customers'

export class CustomersApi extends BaseApi {
    #customersEndpoint

    constructor() {
        super()
        this.#customersEndpoint = new BaseEndpoint(this, customersPath)
    }

    getAllCustomers() { return this.#customersEndpoint.getAll() }

    getCustomerById(id) { return this.#customersEndpoint.getById(id) }

    createCustomer(customer) { return this.#customersEndpoint.create(customer) }

    updateCustomer(id, customer) { return this.#customersEndpoint.update(id, customer) }

    deleteCustomer(id) { return this.#customersEndpoint.delete(id) }
}

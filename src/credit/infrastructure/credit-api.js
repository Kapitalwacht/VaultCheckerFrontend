import { BaseApi } from '@/shared/infrastructure/base-api.js'
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js'

const creditAccountsPath = '/credit-accounts'
const paymentsPath       = '/payments'

export class CreditApi extends BaseApi {
    #creditAccountsEndpoint
    #paymentsEndpoint

    constructor() {
        super()
        this.#creditAccountsEndpoint = new BaseEndpoint(this, creditAccountsPath)
        this.#paymentsEndpoint       = new BaseEndpoint(this, paymentsPath)
    }

    getAllCreditAccounts() { return this.#creditAccountsEndpoint.getAll() }

    getCreditAccountById(id) { return this.#creditAccountsEndpoint.getById(id) }

    createCreditAccount(account) { return this.#creditAccountsEndpoint.create(account) }

    updateCreditAccount(id, account) { return this.#creditAccountsEndpoint.update(id, account) }

    registerPayment(payment) { return this.#paymentsEndpoint.create(payment) }
}

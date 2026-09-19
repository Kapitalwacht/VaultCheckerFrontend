import { BaseApi } from '@/shared/infrastructure/base-api.js'
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js'

const creditAccountsPath     = '/credit-accounts'
const paymentsPath           = '/payments'
const purchasesPath          = '/purchases'
const installmentPaymentsPath = '/installment-payments'

export class CreditApi extends BaseApi {
    #creditAccountsEndpoint
    #paymentsEndpoint
    #purchasesEndpoint
    #installmentPaymentsEndpoint

    constructor() {
        super()
        this.#creditAccountsEndpoint      = new BaseEndpoint(this, creditAccountsPath)
        this.#paymentsEndpoint            = new BaseEndpoint(this, paymentsPath)
        this.#purchasesEndpoint           = new BaseEndpoint(this, purchasesPath)
        this.#installmentPaymentsEndpoint = new BaseEndpoint(this, installmentPaymentsPath)
    }

    getAllCreditAccounts() { return this.#creditAccountsEndpoint.getAll() }

    getCreditAccountById(id) { return this.#creditAccountsEndpoint.getById(id) }

    createCreditAccount(account) { return this.#creditAccountsEndpoint.create(account) }

    updateCreditAccount(id, account) { return this.#creditAccountsEndpoint.update(id, account) }

    registerPayment(payment) { return this.#paymentsEndpoint.create(payment) }

    getAllPurchases() { return this.#purchasesEndpoint.getAll() }

    getPurchaseById(id) { return this.#purchasesEndpoint.getById(id) }

    createPurchase(purchase) { return this.#purchasesEndpoint.create(purchase) }

    updatePurchase(id, purchase) { return this.#purchasesEndpoint.update(id, purchase) }

    getAllInstallmentPayments() { return this.#installmentPaymentsEndpoint.getAll() }

    createInstallmentPayment(payment) { return this.#installmentPaymentsEndpoint.create(payment) }
}

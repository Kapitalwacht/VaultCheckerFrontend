import { BaseApi } from '@/shared/infrastructure/base-api.js'
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js'

const storesPath = '/stores'

export class StoresApi extends BaseApi {
    #storesEndpoint

    constructor() {
        super()
        this.#storesEndpoint = new BaseEndpoint(this, storesPath)
    }

    getAllStores() { return this.#storesEndpoint.getAll() }

    getStoreById(id) { return this.#storesEndpoint.getById(id) }

    createStore(store) { return this.#storesEndpoint.create(store) }

    updateStore(id, store) { return this.#storesEndpoint.update(id, store) }

    deactivateStore(id) { return this.#storesEndpoint.postAction(id, 'deactivate') }
}

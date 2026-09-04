import { BaseApi } from '@/shared/infrastructure/base-api.js'
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js'

const productsPath = '/products'

export class CatalogApi extends BaseApi {
    #productsEndpoint

    constructor() {
        super()
        this.#productsEndpoint = new BaseEndpoint(this, productsPath)
    }

    getAllProducts() { return this.#productsEndpoint.getAll() }

    getProductById(id) { return this.#productsEndpoint.getById(id) }

    createProduct(product) { return this.#productsEndpoint.create(product) }

    updateProduct(id, product) { return this.#productsEndpoint.update(id, product) }

    deleteProduct(id) { return this.#productsEndpoint.delete(id) }
}

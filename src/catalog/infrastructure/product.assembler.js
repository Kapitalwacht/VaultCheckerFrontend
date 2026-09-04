import { Product } from '@/catalog/domain/model/product-entity.js'

export class ProductAssembler {
    static toEntityFromResource(resource) {
        return new Product({
            id: resource.id,
            productId: resource.productId,
            storeId: resource.storeId,
            name: resource.name,
            category: resource.category,
            unit: resource.unit,
            price: resource.price,
            stock: resource.stock,
            state: resource.state
        })
    }

    static toResourceFromEntity(product) {
        return {
            productId: product.productId,
            storeId: product.storeId,
            name: product.name,
            category: product.category,
            unit: product.unit,
            price: product.price,
            stock: product.stock,
            state: product.state
        }
    }
}

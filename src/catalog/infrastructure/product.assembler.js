import { Product } from '@/catalog/domain/model/product-entity.js'

export class ProductAssembler {
    static toEntityFromResource(resource) {
        return new Product({
            id: resource.id,
            productId: resource.productId,
            storeId: resource.storeId,
            name: resource.name,
            category: resource.category,
            brand: resource.brand,
            unit: resource.unit,
            cashPrice: resource.cashPrice,
            listPrice: resource.listPrice,
            paymentMode: resource.paymentMode,
            imageUrl: resource.imageUrl,
            state: resource.state
        })
    }

    static toResourceFromEntity(product) {
        return {
            productId: product.productId,
            storeId: product.storeId,
            name: product.name,
            category: product.category,
            brand: product.brand,
            unit: product.unit,
            cashPrice: product.cashPrice,
            listPrice: product.listPrice,
            paymentMode: product.paymentMode,
            imageUrl: product.imageUrl,
            state: product.state
        }
    }
}

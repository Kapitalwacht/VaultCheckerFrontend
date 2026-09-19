import { Purchase } from '@/credit/domain/model/purchase-entity.js'

export class PurchaseAssembler {
    static toEntityFromResource(resource) {
        return new Purchase({
            id: resource.id,
            purchaseId: resource.purchaseId,
            storeId: resource.storeId,
            customerId: resource.customerId,
            productId: resource.productId,
            description: resource.description,
            quantity: resource.quantity,
            amount: resource.amount,
            purchaseDate: resource.purchaseDate ? String(resource.purchaseDate).slice(0, 10) : null,
            months: resource.months,
            state: resource.state
        })
    }

    static toResourceFromEntity(purchase) {
        return {
            purchaseId: purchase.purchaseId,
            storeId: purchase.storeId,
            customerId: purchase.customerId,
            productId: purchase.productId,
            description: purchase.description,
            quantity: purchase.quantity,
            amount: purchase.amount,
            purchaseDate: purchase.purchaseDate instanceof Date
                ? purchase.purchaseDate.toISOString().slice(0, 10)
                : purchase.purchaseDate,
            months: purchase.months,
            state: purchase.state
        }
    }
}

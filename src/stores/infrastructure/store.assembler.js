import { Store } from '@/stores/domain/model/store-entity.js'

export class StoreAssembler {
    static toEntityFromResource(resource) {
        return new Store({
            id: resource.id,
            storeId: resource.storeId,
            ruc: resource.ruc,
            businessName: resource.businessName,
            category: resource.category,
            address: resource.address,
            phone: resource.phone,
            email: resource.email,
            description: resource.description,
            state: resource.state
        })
    }

    static toResourceFromEntity(store) {
        return {
            storeId: store.storeId,
            ruc: store.ruc,
            businessName: store.businessName,
            category: store.category,
            address: store.address,
            phone: store.phone,
            email: store.email,
            description: store.description,
            state: store.state
        }
    }
}

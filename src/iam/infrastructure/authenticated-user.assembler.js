import { AuthenticatedUser } from '@/iam/domain/model/authenticated-user-entity.js'

export class AuthenticatedUserAssembler {
    static toEntityFromResource(resource) {
        return new AuthenticatedUser({
            id: resource.id,
            userId: resource.userId,
            email: resource.email,
            name: resource.name,
            phone: resource.phone,
            role: resource.role,
            storeId: resource.storeId,
            customerId: resource.customerId,
            token: resource.token
        })
    }
}

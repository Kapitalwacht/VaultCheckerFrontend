import { AuthenticatedUser } from '@/iam/domain/model/authenticated-user-entity.js'

export class AuthenticatedUserAssembler {
    static toEntityFromResource(resource) {
        return new AuthenticatedUser({
            id: resource.id,
            userId: resource.userId,
            email: resource.email,
            role: resource.role,
            token: resource.token
        })
    }
}

import { BaseApi } from '@/shared/infrastructure/base-api.js'
import { AuthenticatedUserAssembler } from '@/iam/infrastructure/authenticated-user.assembler.js'

const authPath = import.meta.env.VITE_AUTH_ENDPOINT_PATH ?? '/authentication'

export class IamApi extends BaseApi {
    signIn(credentials) {
        return this.http
            .post(`${authPath}/sign-in`, credentials)
            .then(response => AuthenticatedUserAssembler.toEntityFromResource(response.data))
    }

    signUp(registration) {
        return this.http
            .post(`${authPath}/sign-up`, registration)
            .then(response => response.data)
    }
}

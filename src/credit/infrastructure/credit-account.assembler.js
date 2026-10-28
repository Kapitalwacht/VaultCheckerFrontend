import { CreditAccount } from '@/credit/domain/model/credit-account-entity.js'
import { fromIsoDate, toIsoDate } from '@/shared/domain/local-date.js'

export class CreditAccountAssembler {
    static toEntityFromResource(resource) {
        return new CreditAccount({
            id: resource.id,
            creditId: resource.creditId,
            storeId: resource.storeId,
            customerId: resource.customerId,
            balance: resource.balance,
            creditLimit: resource.creditLimit,
            dueDate: resource.dueDate ? fromIsoDate(resource.dueDate) : null,
            state: resource.state
        })
    }

    static toResourceFromEntity(account) {
        return {
            creditId: account.creditId,
            storeId: account.storeId,
            customerId: account.customerId,
            balance: account.balance,
            creditLimit: account.creditLimit,
            dueDate: account.dueDate instanceof Date ? toIsoDate(account.dueDate) : account.dueDate
        }
    }
}

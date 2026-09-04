import { CreditAccount } from '@/credit/domain/model/credit-account-entity.js'

export class CreditAccountAssembler {
    static toEntityFromResource(resource) {
        return new CreditAccount({
            id: resource.id,
            creditId: resource.creditId,
            storeId: resource.storeId,
            customerId: resource.customerId,
            balance: resource.balance,
            creditLimit: resource.creditLimit,
            dueDate: resource.dueDate ? new Date(resource.dueDate) : null,
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
            dueDate: account.dueDate instanceof Date ? account.dueDate.toISOString() : account.dueDate,
            state: account.state
        }
    }
}

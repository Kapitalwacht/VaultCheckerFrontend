import { CreditAccount } from '@/credit/domain/model/credit-account-entity.js'

function toLocalDate(value) {
    return new Date(`${String(value).slice(0, 10)}T00:00:00`)
}

function toIsoDate(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${date.getFullYear()}-${month}-${day}`
}

export class CreditAccountAssembler {
    static toEntityFromResource(resource) {
        return new CreditAccount({
            id: resource.id,
            creditId: resource.creditId,
            storeId: resource.storeId,
            customerId: resource.customerId,
            balance: resource.balance,
            creditLimit: resource.creditLimit,
            dueDate: resource.dueDate ? toLocalDate(resource.dueDate) : null,
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

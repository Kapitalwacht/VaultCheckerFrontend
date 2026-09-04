export class CreditAccount {
    constructor({
        id = null,
        creditId = null,
        storeId = null,
        customerId = null,
        balance = 0,
        creditLimit = 0,
        dueDate = null,
        state = 'current'
    } = {}) {
        this.id = id
        this.creditId = creditId
        this.storeId = storeId
        this.customerId = customerId
        this.balance = balance
        this.creditLimit = creditLimit
        this.dueDate = dueDate
        this.state = state
    }

    get availableCredit() {
        return Math.max(this.creditLimit - this.balance, 0)
    }

    get isOverdue() {
        return this.state === 'overdue'
    }
}

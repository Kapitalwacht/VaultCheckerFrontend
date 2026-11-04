export class Purchase {
    constructor({
        id = null,
        purchaseId = null,
        storeId = null,
        customerId = null,
        productId = null,
        description = '',
        quantity = 1,
        amount = 0,
        purchaseDate = null,
        months = 1,
        state = 'active',
        terms = null
    } = {}) {
        this.id = id
        this.purchaseId = purchaseId
        this.storeId = storeId
        this.customerId = customerId
        this.productId = productId
        this.description = description
        this.quantity = quantity
        this.amount = amount
        this.purchaseDate = purchaseDate
        this.months = months
        this.state = state
        this.terms = terms
    }

    termsFor(customer) {
        const agreed = this.terms
        if (!agreed) {
            return {
                rate: customer.compensatoryRate,
                moratoriumRate: customer.moratoriumRate,
                cutoffDay: customer.cutoffDay,
                paymentDay: customer.paymentDay
            }
        }
        const periodDays = agreed.ratePeriodDays ?? undefined
        const capitalizationDays = agreed.rateCapitalizationDays ?? undefined
        return {
            rate: { type: agreed.rateType, value: Number(agreed.rateValue), periodDays, capitalizationDays },
            moratoriumRate: {
                type: agreed.moratoriumRateType,
                value: Number(agreed.moratoriumRateValue),
                periodDays,
                capitalizationDays
            },
            cutoffDay: agreed.cutoffDay,
            paymentDay: agreed.paymentDay
        }
    }

    get isSinglePayment() {
        return Number(this.months) <= 1
    }

    get isActive() {
        return this.state === 'active'
    }
}

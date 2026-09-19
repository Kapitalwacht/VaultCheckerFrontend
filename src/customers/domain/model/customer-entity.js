export class Customer {
    constructor({
        id = null,
        customerId = null,
        storeId = null,
        firstName = '',
        lastName = '',
        dni = '',
        phone = '',
        address = '',
        creditLimit = 0,
        currency = 'PEN',
        rateType = 'effective',
        rateValue = 0,
        rateCapitalizationDays = 30,
        ratePeriodDays = 360,
        moratoriumRateType = 'effective',
        moratoriumRateValue = 0,
        maxMonths = 1,
        cutoffDay = 1,
        paymentDay = 1,
        state = 'active'
    } = {}) {
        this.id = id
        this.customerId = customerId
        this.storeId = storeId
        this.firstName = firstName
        this.lastName = lastName
        this.dni = dni
        this.phone = phone
        this.address = address
        this.creditLimit = creditLimit
        this.currency = currency
        this.rateType = rateType
        this.rateValue = rateValue
        this.rateCapitalizationDays = rateCapitalizationDays
        this.ratePeriodDays = ratePeriodDays
        this.moratoriumRateType = moratoriumRateType
        this.moratoriumRateValue = moratoriumRateValue
        this.maxMonths = maxMonths
        this.cutoffDay = cutoffDay
        this.paymentDay = paymentDay
        this.state = state
    }

    get fullName() {
        return `${this.firstName} ${this.lastName}`.trim()
    }

    get isActive() {
        return this.state === 'active'
    }

    get compensatoryRate() {
        return {
            type: this.rateType,
            value: Number(this.rateValue) || 0,
            periodDays: Number(this.ratePeriodDays) || 360,
            capitalizationDays: Number(this.rateCapitalizationDays) || 30
        }
    }

    get moratoriumRate() {
        return {
            type: this.moratoriumRateType,
            value: Number(this.moratoriumRateValue) || 0,
            periodDays: Number(this.ratePeriodDays) || 360,
            capitalizationDays: Number(this.rateCapitalizationDays) || 30
        }
    }
}

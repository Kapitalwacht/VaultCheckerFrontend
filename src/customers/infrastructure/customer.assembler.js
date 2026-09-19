import { Customer } from '@/customers/domain/model/customer-entity.js'

export class CustomerAssembler {
    static toEntityFromResource(resource) {
        return new Customer({
            id: resource.id,
            customerId: resource.customerId,
            storeId: resource.storeId,
            firstName: resource.firstName,
            lastName: resource.lastName,
            dni: resource.dni,
            phone: resource.phone,
            address: resource.address,
            creditLimit: resource.creditLimit,
            currency: resource.currency,
            rateType: resource.rateType,
            rateValue: resource.rateValue,
            rateCapitalizationDays: resource.rateCapitalizationDays,
            ratePeriodDays: resource.ratePeriodDays,
            moratoriumRateType: resource.moratoriumRateType,
            moratoriumRateValue: resource.moratoriumRateValue,
            maxMonths: resource.maxMonths,
            cutoffDay: resource.cutoffDay,
            paymentDay: resource.paymentDay,
            state: resource.state
        })
    }

    static toResourceFromEntity(customer) {
        return {
            customerId: customer.customerId,
            storeId: customer.storeId,
            firstName: customer.firstName,
            lastName: customer.lastName,
            dni: customer.dni,
            phone: customer.phone,
            address: customer.address,
            creditLimit: customer.creditLimit,
            currency: customer.currency,
            rateType: customer.rateType,
            rateValue: customer.rateValue,
            rateCapitalizationDays: customer.rateCapitalizationDays,
            ratePeriodDays: customer.ratePeriodDays,
            moratoriumRateType: customer.moratoriumRateType,
            moratoriumRateValue: customer.moratoriumRateValue,
            maxMonths: customer.maxMonths,
            cutoffDay: customer.cutoffDay,
            paymentDay: customer.paymentDay,
            state: customer.state
        }
    }
}

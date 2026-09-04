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
            state: customer.state
        }
    }
}

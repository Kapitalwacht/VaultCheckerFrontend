import { Invoice } from '@/subscriptions/domain/model/invoice-entity.js'

export class InvoiceAssembler {
    static toEntityFromResource(resource) {
        return new Invoice({
            id: resource.id,
            invoiceId: resource.invoiceId,
            storeId: resource.storeId,
            planId: resource.planId,
            amount: resource.amount,
            currency: resource.currency,
            status: resource.status,
            date: resource.date
        })
    }
}

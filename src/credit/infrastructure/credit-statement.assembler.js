import { CreditStatement } from '@/credit/domain/model/credit-statement-entity.js'

export class CreditStatementAssembler {
    static toEntityFromResource(resource) {
        return new CreditStatement({
            customerId: resource.customerId,
            storeId: resource.storeId,
            currency: resource.currency,
            cutoffDate: resource.cutoffDate,
            paymentDate: resource.paymentDate,
            lines: resource.lines,
            lateFees: resource.lateFees,
            totalInterest: resource.totalInterest,
            totalPrincipal: resource.totalPrincipal,
            totalLateFee: resource.totalLateFee,
            totalToPay: resource.totalToPay
        })
    }
}

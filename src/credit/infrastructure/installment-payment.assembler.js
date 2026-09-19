import { InstallmentPayment } from '@/credit/domain/model/installment-payment-entity.js'

export class InstallmentPaymentAssembler {
    static toEntityFromResource(resource) {
        return new InstallmentPayment({
            id: resource.id,
            paymentId: resource.paymentId,
            storeId: resource.storeId,
            customerId: resource.customerId,
            purchaseId: resource.purchaseId,
            period: resource.period,
            scheduledDate: resource.scheduledDate,
            paidDate: resource.paidDate,
            installment: resource.installment,
            lateFee: resource.lateFee,
            interest: resource.interest,
            principal: resource.principal,
            total: resource.total,
            state: resource.state
        })
    }

    static toResourceFromEntity(payment) {
        return {
            paymentId: payment.paymentId,
            storeId: payment.storeId,
            customerId: payment.customerId,
            purchaseId: payment.purchaseId,
            period: payment.period,
            scheduledDate: payment.scheduledDate,
            paidDate: payment.paidDate,
            installment: payment.installment,
            lateFee: payment.lateFee,
            interest: payment.interest,
            principal: payment.principal,
            total: payment.total,
            state: payment.state
        }
    }
}

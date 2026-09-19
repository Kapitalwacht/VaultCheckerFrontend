import { Plan } from '@/subscriptions/domain/model/plan-entity.js'

export class PlanAssembler {
    static toEntityFromResource(resource) {
        return new Plan({
            id: resource.id,
            planId: resource.planId,
            name: resource.name,
            priceMonthly: resource.priceMonthly,
            currency: resource.currency,
            features: resource.features || [],
            stripePaymentLink: resource.stripePaymentLink || '',
            highlighted: Boolean(resource.highlighted)
        })
    }
}

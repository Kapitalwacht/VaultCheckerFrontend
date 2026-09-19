import { Subscription } from '@/subscriptions/domain/model/subscription-entity.js'

export class SubscriptionAssembler {
    static toEntityFromResource(resource) {
        return new Subscription({
            id: resource.id,
            subscriptionId: resource.subscriptionId,
            storeId: resource.storeId,
            planId: resource.planId,
            status: resource.status,
            currentPeriodEnd: resource.currentPeriodEnd,
            stripeCustomerId: resource.stripeCustomerId
        })
    }

    static toResourceFromEntity(subscription) {
        return {
            subscriptionId: subscription.subscriptionId,
            storeId: subscription.storeId,
            planId: subscription.planId,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            stripeCustomerId: subscription.stripeCustomerId
        }
    }
}

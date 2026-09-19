import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { SubscriptionsApi } from '@/subscriptions/infrastructure/subscriptions-api.js'
import { PlanAssembler } from '@/subscriptions/infrastructure/plan.assembler.js'
import { SubscriptionAssembler } from '@/subscriptions/infrastructure/subscription.assembler.js'
import { InvoiceAssembler } from '@/subscriptions/infrastructure/invoice.assembler.js'
import { startCheckout } from '@/subscriptions/infrastructure/stripe-checkout.js'
import useAuditStore from '@/audit/application/audit.store.js'

const subscriptionsApi = new SubscriptionsApi()

const PERIOD_DAYS = 30

function nextPeriodEnd() {
    const end = new Date()
    end.setDate(end.getDate() + PERIOD_DAYS)
    return end.toISOString().slice(0, 10)
}

const useSubscriptionsStore = defineStore('subscriptions', () => {
    const plans = ref([])
    const subscription = ref(null)
    const invoices = ref([])
    const loading = ref(false)
    const error = ref(null)

    const currentPlan = computed(() =>
        plans.value.find(plan => plan.planId === subscription.value?.planId) || null)

    function fetchPlans() {
        return subscriptionsApi.getPlans().then(response => {
            plans.value = (response.data || []).map(PlanAssembler.toEntityFromResource)
        })
    }

    function fetchBilling(storeId) {
        loading.value = true
        error.value = null
        return Promise.all([
            subscriptionsApi.getPlans(),
            subscriptionsApi.getSubscriptionByStore(storeId),
            subscriptionsApi.getInvoicesByStore(storeId)
        ]).then(([plansResponse, subscriptionResponse, invoicesResponse]) => {
            plans.value = (plansResponse.data || []).map(PlanAssembler.toEntityFromResource)
            const record = (subscriptionResponse.data || [])[0]
            subscription.value = record ? SubscriptionAssembler.toEntityFromResource(record) : null
            invoices.value = (invoicesResponse.data || []).map(InvoiceAssembler.toEntityFromResource)
            loading.value = false
        }).catch(err => {
            error.value = err.message
            loading.value = false
        })
    }

    function subscribe(storeId, plan) {
        const checkout = startCheckout(plan)
        if (checkout.redirected) {
            return Promise.resolve({ redirected: true })
        }
        return applyPlanChange(storeId, plan).then(() => ({ redirected: false }))
    }

    function applyPlanChange(storeId, plan) {
        const resource = {
            subscriptionId: subscription.value?.subscriptionId || `SU-${Date.now()}`,
            storeId,
            planId: plan.planId,
            status: 'active',
            currentPeriodEnd: nextPeriodEnd(),
            stripeCustomerId: subscription.value?.stripeCustomerId || null
        }
        const persisted = subscription.value?.id
            ? subscriptionsApi.updateSubscription(subscription.value.id, resource)
            : subscriptionsApi.createSubscription(resource)
        return persisted.then(response => {
            subscription.value = SubscriptionAssembler.toEntityFromResource(response.data)
            useAuditStore().recordAction('CHANGE_PLAN', `Store ${storeId} switched to plan ${plan.name}`)
            if (!plan.isFree) {
                return recordInvoice(storeId, plan)
            }
        })
    }

    function recordInvoice(storeId, plan) {
        const now = new Date()
        const resource = {
            invoiceId: `IN-${now.getTime()}`,
            storeId,
            planId: plan.planId,
            amount: plan.priceMonthly,
            currency: plan.currency,
            status: 'paid',
            date: now.toISOString().slice(0, 10)
        }
        return subscriptionsApi.createInvoice(resource).then(response => {
            invoices.value = [InvoiceAssembler.toEntityFromResource(response.data), ...invoices.value]
        })
    }

    return { plans, subscription, invoices, loading, error, currentPlan, fetchPlans, fetchBilling, subscribe }
})

export default useSubscriptionsStore

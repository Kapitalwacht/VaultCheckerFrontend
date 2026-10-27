import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { SubscriptionsApi } from '@/subscriptions/infrastructure/subscriptions-api.js'
import { PlanAssembler } from '@/subscriptions/infrastructure/plan.assembler.js'
import { SubscriptionAssembler } from '@/subscriptions/infrastructure/subscription.assembler.js'
import { InvoiceAssembler } from '@/subscriptions/infrastructure/invoice.assembler.js'
import useAuditStore from '@/audit/application/audit.store.js'

const subscriptionsApi = new SubscriptionsApi()

function newestFirst(a, b) {
    return String(b.date).localeCompare(String(a.date)) || String(b.invoiceId).localeCompare(String(a.invoiceId))
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

    function fetchInvoices(storeId) {
        return subscriptionsApi.getInvoicesByStore(storeId).then(response => {
            invoices.value = (response.data || []).map(InvoiceAssembler.toEntityFromResource).sort(newestFirst)
        })
    }

    function fetchBilling(storeId) {
        loading.value = true
        error.value = null
        return Promise.all([
            subscriptionsApi.getPlans(),
            subscriptionsApi.getSubscriptionByStore(storeId),
            fetchInvoices(storeId)
        ]).then(([plansResponse, subscriptionResponse]) => {
            plans.value = (plansResponse.data || []).map(PlanAssembler.toEntityFromResource)
            const record = (subscriptionResponse.data || [])[0]
            subscription.value = record ? SubscriptionAssembler.toEntityFromResource(record) : null
            loading.value = false
        }).catch(err => {
            error.value = err.message
            loading.value = false
        })
    }

    function subscribe(storeId, plan) {
        return subscriptionsApi.changePlan(storeId, plan.planId).then(response => {
            subscription.value = SubscriptionAssembler.toEntityFromResource(response.data)
            useAuditStore().recordAction('CHANGE_PLAN', `Store ${storeId} switched to plan ${plan.name}`)
            return fetchInvoices(storeId)
        })
    }

    return { plans, subscription, invoices, loading, error, currentPlan, fetchPlans, fetchBilling, subscribe }
})

export default useSubscriptionsStore

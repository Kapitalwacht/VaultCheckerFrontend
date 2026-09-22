<script setup>

import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import useIamStore from '@/iam/application/iam.store.js'
import useSubscriptionsStore from '@/subscriptions/application/subscriptions.store.js'
import { isStripeConfigured } from '@/subscriptions/infrastructure/stripe-checkout.js'
import { useCurrencyFormatter } from '@/shared/infrastructure/currency-formatter.js'

const { t } = useI18n()
const iamStore = useIamStore()
const subscriptionsStore = useSubscriptionsStore()
const { storeId } = storeToRefs(iamStore)
const { plans, subscription, invoices, loading, currentPlan } = storeToRefs(subscriptionsStore)
const { format: formatMoney } = useCurrencyFormatter()

const processingPlanId = ref('')
const actionMessage = ref('')
const stripeReady = isStripeConfigured()

const statusLabel = computed(() =>
    subscription.value ? t(`billing.status.${subscription.value.status}`, subscription.value.status) : '')

function planName(plan) {
    return plan ? t(`billing.planNames.${plan.planId}`, plan.name) : ''
}

function isCurrent(plan) {
    return plan.planId === subscription.value?.planId
}

function choosePlan(plan) {
    if (isCurrent(plan)) return
    processingPlanId.value = plan.planId
    actionMessage.value = ''
    subscriptionsStore.subscribe(storeId.value, plan)
        .then(result => {
            if (!result.redirected) {
                actionMessage.value = t('billing.changed', { plan: planName(plan) })
            }
        })
        .catch(() => {
            actionMessage.value = t('billing.changeError')
        })
        .finally(() => {
            processingPlanId.value = ''
        })
}

onMounted(() => {
    if (storeId.value) subscriptionsStore.fetchBilling(storeId.value)
})

</script>

<template>
    <div class="vc-page">
        <div class="vc-page__head">
            <div class="vc-page__head-text">
                <h1 class="vc-page__title">{{ t('billing.title') }}</h1>
                <p class="vc-page__subtitle">{{ t('billing.subtitle') }}</p>
            </div>
        </div>

        <p v-if="loading" class="billing-loading"><i class="pi pi-spin pi-spinner" /> {{ t('common.loading') }}</p>

        <template v-else>
            <section class="vc-card billing-current">
                <div class="billing-current__info">
                    <p class="billing-current__label">{{ t('billing.currentPlan') }}</p>
                    <h2 class="billing-current__plan">{{ currentPlan ? planName(currentPlan) : t('billing.noPlan') }}</h2>
                    <p v-if="currentPlan" class="billing-current__price">
                        {{ currentPlan.isFree ? t('billing.free') : `${formatMoney(currentPlan.priceMonthly)} ${t('billing.perMonth')}` }}
                    </p>
                </div>
                <div v-if="subscription" class="billing-current__meta">
                    <span class="billing-badge" :class="`billing-badge--${subscription.status}`">{{ statusLabel }}</span>
                    <p v-if="subscription.currentPeriodEnd" class="billing-current__renew">
                        {{ t('billing.renewsOn', { date: subscription.currentPeriodEnd }) }}
                    </p>
                </div>
            </section>

            <p v-if="actionMessage" class="billing-action-msg"><i class="pi pi-check-circle" /> {{ actionMessage }}</p>
            <p v-if="!stripeReady" class="billing-stripe-note"><i class="pi pi-info-circle" /> {{ t('billing.stripeNote') }}</p>

            <h3 class="billing-section-title">{{ t('billing.availablePlans') }}</h3>
            <div class="billing-plans">
                <section
                    v-for="plan in plans"
                    :key="plan.planId"
                    class="vc-card billing-plan"
                    :class="{ 'billing-plan--current': isCurrent(plan), 'billing-plan--highlighted': plan.highlighted }"
                >
                    <p v-if="plan.highlighted" class="billing-plan__tag">{{ t('billing.recommended') }}</p>
                    <h4 class="billing-plan__name">{{ planName(plan) }}</h4>
                    <p class="billing-plan__price">
                        <span class="billing-plan__amount">{{ plan.isFree ? t('billing.free') : formatMoney(plan.priceMonthly) }}</span>
                        <span v-if="!plan.isFree" class="billing-plan__period">{{ t('billing.perMonth') }}</span>
                    </p>
                    <ul class="billing-plan__features">
                        <li v-for="feature in plan.features" :key="feature"><i class="pi pi-check" /> {{ t(feature) }}</li>
                    </ul>
                    <button
                        class="vc-btn"
                        :class="isCurrent(plan) ? 'vc-btn--ghost' : 'vc-btn--primary'"
                        :disabled="isCurrent(plan) || processingPlanId === plan.planId"
                        @click="choosePlan(plan)"
                    >
                        <i v-if="processingPlanId === plan.planId" class="pi pi-spin pi-spinner" />
                        <span>{{ isCurrent(plan) ? t('billing.currentPlanBtn') : t('billing.choosePlan') }}</span>
                    </button>
                </section>
            </div>

            <h3 class="billing-section-title">{{ t('billing.invoices') }}</h3>
            <section class="vc-card billing-invoices">
                <p v-if="!invoices.length" class="billing-invoices__empty">{{ t('billing.noInvoices') }}</p>
                <table v-else class="billing-table">
                    <thead>
                        <tr>
                            <th>{{ t('billing.invoiceDate') }}</th>
                            <th>{{ t('billing.invoiceId') }}</th>
                            <th class="billing-table__right">{{ t('billing.invoiceAmount') }}</th>
                            <th>{{ t('billing.invoiceStatus') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="invoice in invoices" :key="invoice.invoiceId">
                            <td>{{ invoice.date }}</td>
                            <td>{{ invoice.invoiceId }}</td>
                            <td class="billing-table__right">{{ formatMoney(invoice.amount) }}</td>
                            <td>
                                <span class="billing-badge" :class="`billing-badge--${invoice.status}`">
                                    {{ t(`billing.invoiceStatuses.${invoice.status}`, invoice.status) }}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </section>
        </template>
    </div>
</template>

<style scoped>
.billing-loading { display: flex; align-items: center; gap: 0.5rem; color: var(--vc-text-muted); }
.billing-current {
    display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: space-between;
    padding: 1.5rem;
}
.billing-current__label { margin: 0 0 0.25rem; font-size: 0.8rem; color: var(--vc-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.billing-current__plan { margin: 0; font-size: 1.5rem; }
.billing-current__price { margin: 0.25rem 0 0; color: var(--vc-text-muted); }
.billing-current__meta { text-align: right; }
.billing-current__renew { margin: 0.5rem 0 0; font-size: 0.85rem; color: var(--vc-text-muted); }
.billing-badge {
    display: inline-block; padding: 0.2rem 0.6rem; border-radius: 999px;
    font-size: 0.75rem; font-weight: 600; text-transform: capitalize;
    background: rgba(22, 163, 74, 0.14); color: var(--vc-brand-700, var(--vc-brand-600));
}
.billing-badge--past_due, .billing-badge--open { background: rgba(220, 38, 38, 0.12); color: var(--vc-danger-500); }
.billing-badge--canceled { background: var(--vc-surface-2); color: var(--vc-text-muted); }
.billing-action-msg { display: flex; align-items: center; gap: 0.5rem; color: var(--vc-brand-600, var(--vc-brand-500)); font-size: 0.9rem; }
.billing-stripe-note {
    display: flex; align-items: center; gap: 0.5rem; margin: 0;
    padding: 0.7rem 0.9rem; border-radius: 10px; font-size: 0.85rem;
    background: rgba(22, 163, 74, 0.1); color: var(--vc-text);
}
.billing-section-title { margin: 1.75rem 0 0.75rem; font-size: 1.05rem; }
.billing-plans { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; }
.billing-plan { display: flex; flex-direction: column; gap: 0.75rem; padding: 1.5rem; }
.billing-plan--highlighted { border-color: var(--vc-brand-500); }
.billing-plan--current { outline: 2px solid var(--vc-brand-500); outline-offset: -1px; }
.billing-plan__tag { align-self: flex-start; margin: 0; padding: 0.15rem 0.6rem; border-radius: 999px; font-size: 0.72rem; font-weight: 700; background: var(--vc-brand-500); color: #fff; }
.billing-plan__name { margin: 0; font-size: 1.15rem; }
.billing-plan__price { margin: 0; display: flex; align-items: baseline; gap: 0.35rem; }
.billing-plan__amount { font-size: 1.6rem; font-weight: 700; }
.billing-plan__period { color: var(--vc-text-muted); font-size: 0.85rem; }
.billing-plan__features { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; flex: 1; }
.billing-plan__features li { display: flex; align-items: center; gap: 0.5rem; font-size: 0.88rem; color: var(--vc-text); }
.billing-plan__features .pi-check { color: var(--vc-brand-500); font-size: 0.8rem; }
.billing-plan .vc-btn { justify-content: center; }
.billing-invoices { padding: 0.5rem 1rem; }
.billing-invoices__empty { color: var(--vc-text-muted); padding: 1rem 0.5rem; margin: 0; }
.billing-table { width: 100%; border-collapse: collapse; }
.billing-table th, .billing-table td { text-align: left; padding: 0.75rem 0.5rem; border-bottom: 1px solid var(--vc-border); font-size: 0.9rem; }
.billing-table th { color: var(--vc-text-muted); font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.03em; }
.billing-table tbody tr:last-child td { border-bottom: none; }
.billing-table__right { text-align: right; }
</style>

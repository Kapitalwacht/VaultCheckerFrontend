<script setup>

import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import useIamStore from '@/iam/application/iam.store.js'
import useSubscriptionsStore from '@/subscriptions/application/subscriptions.store.js'
import { useCurrencyFormatter } from '@/shared/infrastructure/currency-formatter.js'
import VcModal from '@/shared/presentation/components/vc-modal.vue'

const PENDING_CHECKOUT_KEY = 'vc.pendingCheckout'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const iamStore = useIamStore()
const subscriptionsStore = useSubscriptionsStore()
const { storeId, currentUser } = storeToRefs(iamStore)
const { plans, subscription, invoices, loading, currentPlan } = storeToRefs(subscriptionsStore)
const { format: formatMoney } = useCurrencyFormatter()

const processingPlanId = ref('')
const actionMessage = ref('')
const checkoutPlan = ref(null)
const checkoutStep = ref('review')
const checkoutError = ref('')

const statusLabel = computed(() =>
    subscription.value ? t(`billing.status.${subscription.value.status}`, subscription.value.status) : '')

function planName(plan) {
    return plan ? t(`billing.planNames.${plan.planId}`, plan.name) : ''
}

function isCurrent(plan) {
    return plan.planId === subscription.value?.planId
}

function applyPlan(plan) {
    processingPlanId.value = plan.planId
    actionMessage.value = ''
    return subscriptionsStore.subscribe(storeId.value, plan)
        .then(() => {
            actionMessage.value = t('billing.changed', { plan: planName(plan) })
        })
        .finally(() => {
            processingPlanId.value = ''
        })
}

function choosePlan(plan) {
    if (isCurrent(plan)) return
    if (plan.isFree) {
        applyPlan(plan).catch(() => { actionMessage.value = t('billing.changeError') })
        return
    }
    checkoutPlan.value = plan
    checkoutStep.value = 'review'
    checkoutError.value = ''
}

function closeCheckout() {
    if (checkoutStep.value === 'processing') return
    checkoutPlan.value = null
}

function stripeCheckoutUrl(plan) {
    const url = new URL(plan.stripePaymentLink)
    if (storeId.value) url.searchParams.set('client_reference_id', storeId.value)
    if (currentUser.value?.email) url.searchParams.set('prefilled_email', currentUser.value.email)
    return url.toString()
}

function payCheckout() {
    const plan = checkoutPlan.value
    checkoutError.value = ''
    if (!plan.stripePaymentLink) {
        checkoutError.value = t('billing.checkout.unavailable')
        return
    }
    checkoutStep.value = 'processing'
    try {
        sessionStorage.setItem(PENDING_CHECKOUT_KEY, plan.planId)
    } catch {}
    window.location.assign(stripeCheckoutUrl(plan))
}

function readPendingCheckout() {
    try {
        const planId = sessionStorage.getItem(PENDING_CHECKOUT_KEY)
        sessionStorage.removeItem(PENDING_CHECKOUT_KEY)
        return planId
    } catch {
        return null
    }
}

async function completeStripeCheckout() {
    const planId = readPendingCheckout()
    router.replace({ query: { ...route.query, checkout: undefined } })
    const plan = plans.value.find(p => p.planId === planId)
    if (!plan || isCurrent(plan)) return
    checkoutPlan.value = plan
    checkoutStep.value = 'processing'
    try {
        await applyPlan(plan)
        checkoutStep.value = 'done'
    } catch {
        checkoutStep.value = 'review'
        checkoutError.value = t('billing.changeError')
    }
}

onMounted(async () => {
    if (!storeId.value) return
    await subscriptionsStore.fetchBilling(storeId.value)
    if (route.query.checkout === 'success') await completeStripeCheckout()
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
            <p class="billing-stripe-note"><i class="pi pi-info-circle" /> {{ t('billing.demoNote') }}</p>

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

        <VcModal :open="Boolean(checkoutPlan)" :title="t('billing.checkout.title')" @close="closeCheckout">
            <div v-if="checkoutPlan" class="checkout">
                <template v-if="checkoutStep !== 'done'">
                    <div class="checkout__summary">
                        <div>
                            <p class="checkout__label">{{ t('billing.checkout.plan') }}</p>
                            <p class="checkout__plan">{{ planName(checkoutPlan) }}</p>
                        </div>
                        <div class="checkout__total">
                            <p class="checkout__label">{{ t('billing.checkout.totalToday') }}</p>
                            <p class="checkout__amount">{{ formatMoney(checkoutPlan.priceMonthly) }}</p>
                        </div>
                    </div>

                    <p class="checkout__note"><i class="pi pi-shield" /> {{ t('billing.checkout.stripeNote') }}</p>
                    <p v-if="checkoutError" class="checkout__error"><i class="pi pi-exclamation-triangle" /> {{ checkoutError }}</p>
                </template>

                <div v-else class="checkout__done">
                    <span class="checkout__done-icon"><i class="pi pi-check" /></span>
                    <h3 class="checkout__done-title">{{ t('billing.checkout.successTitle') }}</h3>
                    <p class="checkout__done-text">{{ t('billing.checkout.successText', { plan: planName(checkoutPlan) }) }}</p>
                </div>
            </div>
            <template #footer>
                <template v-if="checkoutStep !== 'done'">
                    <button class="vc-btn vc-btn--ghost" type="button" :disabled="checkoutStep === 'processing'" @click="closeCheckout">
                        {{ t('common.cancel') }}
                    </button>
                    <button class="vc-btn vc-btn--primary" type="button" :disabled="checkoutStep === 'processing'" @click="payCheckout">
                        <i v-if="checkoutStep === 'processing'" class="pi pi-spin pi-spinner" />
                        {{ checkoutStep === 'processing'
                            ? t('billing.checkout.redirecting')
                            : t('billing.checkout.payStripe', { amount: formatMoney(checkoutPlan?.priceMonthly) }) }}
                    </button>
                </template>
                <button v-else class="vc-btn vc-btn--primary" type="button" @click="closeCheckout">{{ t('billing.checkout.close') }}</button>
            </template>
        </VcModal>
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

.checkout { display: flex; flex-direction: column; gap: 1.1rem; }
.checkout__summary {
    display: flex; justify-content: space-between; gap: 1rem; align-items: flex-end;
    padding: 0.9rem 1rem; border-radius: 12px; background: var(--vc-surface-2);
}
.checkout__label { margin: 0; font-size: 0.75rem; color: var(--vc-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.checkout__plan { margin: 0.15rem 0 0; font-size: 1.1rem; font-weight: 700; }
.checkout__total { text-align: right; }
.checkout__amount { margin: 0.15rem 0 0; font-size: 1.4rem; font-weight: 700; color: var(--vc-brand-600, var(--vc-brand-500)); }

.checkout__note { display: flex; align-items: center; gap: 0.5rem; margin: 0; font-size: 0.82rem; color: var(--vc-text-muted); }
.checkout__error { margin: 0; color: var(--vc-danger-500); font-size: 0.9rem; }

.checkout__done { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.5rem; padding: 1rem 0; }
.checkout__done-icon {
    display: grid; place-items: center; width: 64px; height: 64px; border-radius: 50%;
    background: var(--vc-brand-500); color: #fff; font-size: 1.8rem;
    animation: checkout-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.checkout__done-title { margin: 0.5rem 0 0; font-size: 1.2rem; }
.checkout__done-text { margin: 0; color: var(--vc-text-muted); }

@keyframes checkout-pop { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }

@media (prefers-reduced-motion: reduce) {
    .checkout__done-icon { animation: none; }
}
</style>

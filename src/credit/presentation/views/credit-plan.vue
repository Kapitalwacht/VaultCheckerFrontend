<script setup>
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import useCreditStore from '@/credit/application/credit.store.js'
import useCustomersStore from '@/customers/application/customers.store.js'
import useCatalogStore from '@/catalog/application/catalog.store.js'
import { useCurrencyFormatter } from '@/shared/infrastructure/currency-formatter.js'
import { buildPaymentPlan, settleInstallment } from '@/credit/domain/services/payment-plan.js'
import { useStoreScope } from '@/iam/application/use-store-scope.js'
import VcModal from '@/shared/presentation/components/vc-modal.vue'
import StatusBadge from '@/shared/presentation/components/status-badge.vue'

const { t } = useI18n()
const { format: formatCurrency } = useCurrencyFormatter()
const creditStore = useCreditStore()
const customersStore = useCustomersStore()
const catalogStore = useCatalogStore()
const { scope, scopeStoreId } = useStoreScope()
const { error } = storeToRefs(creditStore)
const { customers } = storeToRefs(customersStore)
const { products } = storeToRefs(catalogStore)

const scopedCustomers = computed(() => scope(customers.value))

const selectedCustomerId = ref('')
const modalOpen = ref(false)
const saving = ref(false)

const payModalOpen = ref(false)
const paying = ref(false)
const payRow = ref(null)
const payPurchase = ref(null)
const payDate = ref(new Date().toISOString().slice(0, 10))

const blankForm = () => ({
    productId: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    purchaseDate: new Date().toISOString().slice(0, 10),
    months: 1
})
const form = reactive(blankForm())

const selectedCustomer = computed(() =>
    customers.value.find(c => c.id === selectedCustomerId.value) || null)

const availableCredit = computed(() =>
    selectedCustomer.value ? creditStore.availableCreditFor(selectedCustomer.value) : 0)

const amount = computed(() =>
    (Number(form.quantity) || 0) * (Number(form.unitPrice) || 0))

const activeProducts = computed(() => scope(products.value).filter(p => p.isActive))

const plans = computed(() => {
    const customer = selectedCustomer.value
    if (!customer) return []
    const terms = {
        rate: customer.compensatoryRate,
        cutoffDay: customer.cutoffDay,
        paymentDay: customer.paymentDay
    }
    return creditStore.purchasesByCustomer(customer.id).map(purchase => ({
        purchase,
        plan: buildPaymentPlan(
            { amount: purchase.amount, purchaseDate: purchase.purchaseDate, months: purchase.months },
            terms
        )
    }))
})

function onProductChange() {
    const product = products.value.find(p => p.id === form.productId)
    if (product) {
        form.description = product.name
        form.unitPrice = product.listPrice
    }
}

function fmtDate(value) {
    if (!value) return '—'
    let d
    if (value instanceof Date) {
        d = value
    } else {
        const [y, m, day] = String(value).slice(0, 10).split('-').map(Number)
        d = new Date(y, (m || 1) - 1, day || 1)
    }
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

function openCreate() {
    Object.assign(form, blankForm())
    error.value = null
    modalOpen.value = true
}

function closeModal() {
    if (saving.value) return
    modalOpen.value = false
}

async function submit() {
    if (!selectedCustomer.value) return
    saving.value = true
    error.value = null
    try {
        await creditStore.registerPurchase({
            storeId: selectedCustomer.value.storeId,
            customerId: selectedCustomer.value.id,
            productId: form.productId || null,
            description: form.description,
            quantity: Number(form.quantity) || 1,
            amount: amount.value,
            purchaseDate: form.purchaseDate,
            months: Number(form.months) || 1,
            state: 'active'
        }, selectedCustomer.value)
        modalOpen.value = false
    } catch (e) {
        error.value = t(`credit.plan.error.${e.message}`, e.message)
    } finally {
        saving.value = false
    }
}

function isPeriodPaid(purchaseId, period) {
    return creditStore.isPeriodPaid(purchaseId, period)
}

function nextPayablePeriod(purchaseId, plan) {
    const pending = plan.rows.find(row => !isPeriodPaid(purchaseId, row.period))
    return pending ? pending.period : null
}

const settlement = computed(() => {
    if (!payRow.value || !selectedCustomer.value) return null
    return settleInstallment(payRow.value, payDate.value, selectedCustomer.value.moratoriumRate)
})

function openPay(row, purchase) {
    payRow.value = row
    payPurchase.value = purchase
    payDate.value = new Date().toISOString().slice(0, 10)
    error.value = null
    payModalOpen.value = true
}

function closePay() {
    if (paying.value) return
    payModalOpen.value = false
}

async function submitPay() {
    if (!settlement.value || !payPurchase.value || !selectedCustomer.value) return
    paying.value = true
    error.value = null
    try {
        const s = settlement.value
        await creditStore.registerInstallmentPayment({
            storeId: selectedCustomer.value.storeId,
            customerId: selectedCustomer.value.id,
            purchaseId: payPurchase.value.id,
            period: s.period,
            scheduledDate: s.scheduledDate,
            paidDate: s.paidDate,
            installment: s.installment,
            lateFee: s.lateFee,
            interest: s.interest,
            principal: s.principal,
            total: s.total,
            state: 'paid'
        })
        payModalOpen.value = false
    } catch (e) {
        error.value = t(`credit.plan.error.${e.message}`, e.message)
    } finally {
        paying.value = false
    }
}

watch(selectedCustomer, customer => {
    if (customer) form.months = Math.min(Number(form.months) || 1, Number(customer.maxMonths) || 1)
})

onMounted(() => {
    customersStore.fetchCustomers()
    catalogStore.fetchProducts()
    creditStore.fetchPurchases()
    creditStore.fetchInstallmentPayments()
})
</script>

<template>
    <div class="vc-page">
        <div class="vc-page__head">
            <div class="vc-page__head-text">
                <h1 class="vc-page__title">{{ t('nav.plan') }}</h1>
                <p class="vc-page__subtitle">{{ t('credit.plan.subtitle') }}</p>
            </div>
            <button class="vc-btn vc-btn--primary" :disabled="!selectedCustomer" @click="openCreate">
                <i class="pi pi-plus" /> {{ t('credit.plan.newPurchase') }}
            </button>
        </div>

        <div class="vc-toolbar">
            <label class="vc-field plan-picker">
                <span class="vc-field__label">{{ t('credit.field.customer') }}</span>
                <select v-model="selectedCustomerId" class="vc-select">
                    <option value="">{{ t('credit.selectCustomer') }}</option>
                    <option v-for="c in scopedCustomers" :key="c.id" :value="c.id">{{ c.fullName }}</option>
                </select>
            </label>
        </div>

        <div v-if="selectedCustomer" class="plan-kpis">
            <article class="vc-card plan-kpi">
                <span class="plan-kpi__label">{{ t('customers.field.creditLimit') }}</span>
                <span class="plan-kpi__value">{{ formatCurrency(selectedCustomer.creditLimit) }}</span>
            </article>
            <article class="vc-card plan-kpi">
                <span class="plan-kpi__label">{{ t('credit.plan.available') }}</span>
                <span class="plan-kpi__value">{{ formatCurrency(availableCredit) }}</span>
            </article>
            <article class="vc-card plan-kpi">
                <span class="plan-kpi__label">{{ t('customers.field.rate') }}</span>
                <span class="plan-kpi__value">
                    {{ ((Number(selectedCustomer.rateValue) || 0) * 100).toFixed(2) }}%
                    {{ t(`customers.rateType.${selectedCustomer.rateType}`) }}
                </span>
            </article>
            <article class="vc-card plan-kpi">
                <span class="plan-kpi__label">{{ t('credit.plan.calendar') }}</span>
                <span class="plan-kpi__value plan-kpi__value--sm">
                    {{ t('customers.field.cutoffDay') }}: {{ selectedCustomer.cutoffDay }} ·
                    {{ t('customers.field.paymentDay') }}: {{ selectedCustomer.paymentDay }}
                </span>
            </article>
        </div>

        <div v-if="!selectedCustomer" class="vc-card vc-state">
            <div class="vc-state__icon"><i class="pi pi-user" /></div>
            <p class="vc-state__title">{{ t('credit.plan.pickTitle') }}</p>
            <p class="vc-state__text">{{ t('credit.plan.pickText') }}</p>
        </div>

        <div v-else-if="!plans.length" class="vc-card vc-state">
            <div class="vc-state__icon"><i class="pi pi-calculator" /></div>
            <p class="vc-state__title">{{ t('credit.plan.emptyTitle') }}</p>
            <p class="vc-state__text">{{ t('credit.plan.emptyText') }}</p>
            <button class="vc-btn vc-btn--primary" @click="openCreate">
                <i class="pi pi-plus" /> {{ t('credit.plan.newPurchase') }}
            </button>
        </div>

        <div v-else class="plan-list">
            <article v-for="({ purchase, plan }) in plans" :key="purchase.id" class="vc-card plan-item">
                <header class="plan-item__head">
                    <div>
                        <h2 class="plan-item__title">{{ purchase.description || t('credit.plan.purchase') }}</h2>
                        <p class="plan-item__meta">
                            {{ fmtDate(purchase.purchaseDate) }} ·
                            {{ t('credit.plan.principal') }}: {{ formatCurrency(plan.principal) }} ·
                            <template v-if="plan.mode === 'installments'">
                                {{ purchase.months }} {{ t('credit.plan.months') }}
                            </template>
                            <template v-else>{{ t('credit.plan.single') }}</template>
                        </p>
                    </div>
                    <div class="plan-item__total">
                        <span class="plan-item__total-label">{{ t('credit.plan.totalToPay') }}</span>
                        <span class="plan-item__total-value">{{ formatCurrency(plan.totalToPay) }}</span>
                    </div>
                </header>

                <p class="plan-item__grace">
                    <i class="pi pi-info-circle" />
                    {{ t('credit.plan.graceInfo', { days: plan.graceDays, date: fmtDate(plan.firstPaymentDate) }) }}
                    <template v-if="plan.mode === 'installments'">
                        · {{ t('credit.plan.capitalized') }}: {{ formatCurrency(plan.capitalizedDebt) }}
                        · {{ t('credit.plan.installment') }}: {{ formatCurrency(plan.installment) }}
                    </template>
                </p>

                <div class="vc-table-wrap">
                    <table class="vc-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>{{ t('credit.field.date') }}</th>
                                <th class="vc-table__num">{{ t('credit.plan.installment') }}</th>
                                <th class="vc-table__num">{{ t('credit.plan.interest') }}</th>
                                <th class="vc-table__num">{{ t('credit.plan.principalCol') }}</th>
                                <th class="vc-table__num">{{ t('credit.plan.balance') }}</th>
                                <th>{{ t('common.state') }}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in plan.rows" :key="row.period">
                                <td>{{ row.period }}</td>
                                <td>{{ fmtDate(row.date) }}</td>
                                <td class="vc-table__num">{{ formatCurrency(row.installment) }}</td>
                                <td class="vc-table__num">{{ formatCurrency(row.interest) }}</td>
                                <td class="vc-table__num">{{ formatCurrency(row.principal) }}</td>
                                <td class="vc-table__num">{{ formatCurrency(row.balance) }}</td>
                                <td>
                                    <StatusBadge
                                        :tone="isPeriodPaid(purchase.id, row.period) ? 'success' : 'neutral'"
                                        :label="isPeriodPaid(purchase.id, row.period) ? t('credit.plan.paid') : t('credit.plan.pending')"
                                    />
                                </td>
                                <td class="vc-table__actions">
                                    <button
                                        v-if="row.period === nextPayablePeriod(purchase.id, plan)"
                                        class="vc-btn vc-btn--ghost vc-btn--sm"
                                        @click="openPay(row, purchase)"
                                    >
                                        <i class="pi pi-wallet" /> {{ t('credit.plan.pay') }}
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </article>
        </div>

        <VcModal :open="modalOpen" :title="t('credit.plan.newPurchase')" @close="closeModal">
            <form id="purchase-form" class="vc-form-grid" @submit.prevent="submit">
                <label class="vc-field vc-field--full">
                    <span class="vc-field__label">{{ t('credit.plan.product') }}</span>
                    <select v-model="form.productId" class="vc-select" @change="onProductChange">
                        <option value="">{{ t('credit.plan.freeItem') }}</option>
                        <option v-for="p in activeProducts" :key="p.id" :value="p.id">{{ p.name }}</option>
                    </select>
                </label>
                <label class="vc-field vc-field--full">
                    <span class="vc-field__label">{{ t('credit.plan.description') }}</span>
                    <input v-model="form.description" class="vc-input" required />
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('credit.plan.quantity') }}</span>
                    <input v-model="form.quantity" type="number" min="1" step="1" class="vc-input" />
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('credit.plan.unitPrice') }}</span>
                    <input v-model="form.unitPrice" type="number" min="0" step="0.01" class="vc-input" />
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('credit.plan.purchaseDate') }}</span>
                    <input v-model="form.purchaseDate" type="date" class="vc-input" required />
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('credit.plan.months') }}</span>
                    <input
                        v-model="form.months"
                        type="number"
                        min="1"
                        :max="selectedCustomer?.maxMonths || 1"
                        step="1"
                        class="vc-input"
                    />
                </label>
                <p class="plan-form__amount">
                    {{ t('credit.plan.amount') }}: <strong>{{ formatCurrency(amount) }}</strong>
                    · {{ t('credit.plan.available') }}: <strong>{{ formatCurrency(availableCredit) }}</strong>
                </p>
                <p v-if="error" class="plan-form__error"><i class="pi pi-exclamation-triangle" /> {{ error }}</p>
            </form>

            <template #footer>
                <button class="vc-btn vc-btn--ghost" type="button" @click="closeModal">{{ t('common.cancel') }}</button>
                <button class="vc-btn vc-btn--primary" type="submit" form="purchase-form" :disabled="saving">
                    <i v-if="saving" class="pi pi-spinner vc-spin" />
                    {{ t('common.save') }}
                </button>
            </template>
        </VcModal>

        <VcModal :open="payModalOpen" :title="t('credit.plan.payInstallment')" @close="closePay">
            <div v-if="settlement" class="pay-detail">
                <p class="pay-detail__ctx">
                    {{ t('credit.plan.installment') }} #{{ settlement.period }} ·
                    {{ t('credit.plan.dueOn') }} {{ fmtDate(settlement.scheduledDate) }}
                </p>
                <form id="pay-form" class="vc-form-grid" @submit.prevent="submitPay">
                    <label class="vc-field vc-field--full">
                        <span class="vc-field__label">{{ t('credit.plan.paidDate') }}</span>
                        <input v-model="payDate" type="date" class="vc-input" required />
                    </label>
                </form>

                <p v-if="settlement.overdueDays > 0" class="pay-detail__late">
                    <i class="pi pi-exclamation-triangle" />
                    {{ t('credit.plan.overdueInfo', { days: settlement.overdueDays }) }}
                </p>

                <ul class="pay-detail__breakdown">
                    <li>
                        <span>{{ t('credit.plan.lateFee') }}</span>
                        <strong>{{ formatCurrency(settlement.allocation.paidLateFee) }}</strong>
                    </li>
                    <li>
                        <span>{{ t('credit.plan.interest') }}</span>
                        <strong>{{ formatCurrency(settlement.allocation.paidInterest) }}</strong>
                    </li>
                    <li>
                        <span>{{ t('credit.plan.principalCol') }}</span>
                        <strong>{{ formatCurrency(settlement.allocation.paidPrincipal) }}</strong>
                    </li>
                    <li class="pay-detail__total">
                        <span>{{ t('credit.plan.totalToPay') }}</span>
                        <strong>{{ formatCurrency(settlement.total) }}</strong>
                    </li>
                </ul>
                <p class="pay-detail__hint">{{ t('credit.plan.allocationHint') }}</p>
                <p v-if="error" class="plan-form__error"><i class="pi pi-exclamation-triangle" /> {{ error }}</p>
            </div>

            <template #footer>
                <button class="vc-btn vc-btn--ghost" type="button" @click="closePay">{{ t('common.cancel') }}</button>
                <button class="vc-btn vc-btn--primary" type="submit" form="pay-form" :disabled="paying">
                    <i v-if="paying" class="pi pi-spinner vc-spin" />
                    {{ t('credit.plan.confirmPay') }}
                </button>
            </template>
        </VcModal>
    </div>
</template>

<style scoped>
.plan-picker { max-width: 320px; }
.plan-kpis {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
}
.plan-kpi { display: flex; flex-direction: column; gap: 0.3rem; padding: 1rem 1.15rem; }
.plan-kpi__label { font-size: 0.8rem; color: var(--vc-text-muted); }
.plan-kpi__value { font-size: 1.25rem; font-weight: 700; color: var(--vc-text); }
.plan-kpi__value--sm { font-size: 0.95rem; font-weight: 600; }
.plan-list { display: flex; flex-direction: column; gap: 1.25rem; }
.plan-item { padding: 1.25rem; }
.plan-item__head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 0.75rem;
}
.plan-item__title { margin: 0; font-size: 1.05rem; }
.plan-item__meta { margin: 0.2rem 0 0; font-size: 0.85rem; color: var(--vc-text-muted); }
.plan-item__total { text-align: right; }
.plan-item__total-label { display: block; font-size: 0.75rem; color: var(--vc-text-muted); }
.plan-item__total-value { font-size: 1.2rem; font-weight: 700; color: var(--vc-brand-600, var(--vc-text)); }
.plan-item__grace {
    margin: 0 0 0.9rem;
    padding: 0.6rem 0.8rem;
    border-radius: 10px;
    background: var(--vc-surface-2);
    color: var(--vc-text-muted);
    font-size: 0.85rem;
}
.plan-form__amount {
    grid-column: 1 / -1;
    margin: 0.3rem 0 0;
    font-size: 0.9rem;
    color: var(--vc-text-muted);
}
.plan-form__error {
    grid-column: 1 / -1;
    margin: 0;
    color: var(--vc-danger-500);
    font-size: 0.9rem;
}
.pay-detail__ctx {
    margin: 0 0 1rem;
    padding: 0.7rem 0.9rem;
    border-radius: 10px;
    background: var(--vc-surface-2);
    color: var(--vc-text-muted);
    font-size: 0.9rem;
}
.pay-detail__late {
    margin: 0.8rem 0 0;
    color: var(--vc-danger-500);
    font-size: 0.88rem;
}
.pay-detail__breakdown {
    list-style: none;
    margin: 1rem 0 0;
    padding: 0;
}
.pay-detail__breakdown li {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--vc-border, rgba(0, 0, 0, 0.08));
    font-size: 0.92rem;
    color: var(--vc-text-muted);
}
.pay-detail__breakdown .pay-detail__total {
    border-bottom: none;
    font-size: 1.05rem;
    color: var(--vc-text);
}
.pay-detail__hint {
    margin: 0.6rem 0 0;
    font-size: 0.8rem;
    color: var(--vc-text-muted);
}
</style>

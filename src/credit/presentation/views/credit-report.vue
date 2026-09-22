<script setup>

import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import useCreditStore from '@/credit/application/credit.store.js'
import useCustomersStore from '@/customers/application/customers.store.js'
import useIamStore from '@/iam/application/iam.store.js'
import { useStoreScope } from '@/iam/application/use-store-scope.js'
import { useCurrencyFormatter } from '@/shared/infrastructure/currency-formatter.js'
import { buildPaymentPlan, buildStatement } from '@/credit/domain/services/payment-plan.js'

const { t } = useI18n()
const { format: formatCurrency } = useCurrencyFormatter()
const { scope } = useStoreScope()
const creditStore = useCreditStore()
const customersStore = useCustomersStore()
const iamStore = useIamStore()
const { customers } = storeToRefs(customersStore)
const { role, customerId } = storeToRefs(iamStore)

const isCustomerView = computed(() => role.value === 'customer')
const scopedCustomers = computed(() => scope(customers.value))

const selectedCustomerId = ref('')
const referenceDate = ref(new Date().toISOString().slice(0, 10))

const selectedCustomer = computed(() => {
    const id = isCustomerView.value ? customerId.value : selectedCustomerId.value
    return customers.value.find(c => c.id === id) || null
})

const statement = computed(() => {
    const customer = selectedCustomer.value
    if (!customer) return null
    const terms = {
        rate: customer.compensatoryRate,
        cutoffDay: customer.cutoffDay,
        paymentDay: customer.paymentDay
    }
    const entries = creditStore.purchasesByCustomer(customer.id).map(purchase => ({
        purchase,
        plan: buildPaymentPlan(
            { amount: purchase.amount, purchaseDate: purchase.purchaseDate, months: purchase.months },
            terms
        )
    }))
    return buildStatement(
        entries,
        referenceDate.value,
        customer.moratoriumRate,
        (purchaseId, period) => creditStore.isPeriodPaid(purchaseId, period)
    )
})

function fmtDate(value) {
    if (!value) return '—'
    const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
    const date = new Date(y, (m || 1) - 1, d || 1)
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

onMounted(() => {
    customersStore.fetchCustomers()
    creditStore.fetchPurchases()
    creditStore.fetchInstallmentPayments()
})

</script>

<template>
    <div class="vc-page">
        <div class="vc-page__head">
            <div class="vc-page__head-text">
                <h1 class="vc-page__title">{{ t('nav.report') }}</h1>
                <p class="vc-page__subtitle">{{ t('credit.report.subtitle') }}</p>
            </div>
        </div>

        <div class="vc-toolbar report-toolbar">
            <label v-if="!isCustomerView" class="vc-field report-picker">
                <span class="vc-field__label">{{ t('credit.field.customer') }}</span>
                <select v-model="selectedCustomerId" class="vc-select">
                    <option value="">{{ t('credit.selectCustomer') }}</option>
                    <option v-for="c in scopedCustomers" :key="c.id" :value="c.id">{{ c.fullName }}</option>
                </select>
            </label>
            <label class="vc-field report-picker">
                <span class="vc-field__label">{{ t('credit.report.cutoffDate') }}</span>
                <input v-model="referenceDate" type="date" class="vc-input" />
            </label>
        </div>

        <div v-if="!selectedCustomer" class="vc-card vc-state">
            <div class="vc-state__icon"><i class="pi pi-file" /></div>
            <p class="vc-state__title">{{ t('credit.report.pickTitle') }}</p>
            <p class="vc-state__text">{{ t('credit.report.pickText') }}</p>
        </div>

        <div v-else-if="!statement.items.length" class="vc-card vc-state">
            <div class="vc-state__icon"><i class="pi pi-check-circle" /></div>
            <p class="vc-state__title">{{ t('credit.report.emptyTitle') }}</p>
            <p class="vc-state__text">{{ t('credit.report.emptyText') }}</p>
        </div>

        <article v-else class="vc-card report-doc">
            <header class="report-doc__head">
                <div>
                    <h2 class="report-doc__title">{{ t('credit.report.docTitle') }}</h2>
                    <p class="report-doc__meta">
                        {{ selectedCustomer.fullName }} · {{ t('customers.field.paymentDay') }}:
                        {{ selectedCustomer.paymentDay }} · {{ t('credit.report.cutoffDate') }}:
                        {{ fmtDate(referenceDate) }}
                    </p>
                </div>
            </header>

            <div class="vc-table-wrap">
                <table class="vc-table">
                    <thead>
                        <tr>
                            <th>{{ t('credit.report.dueDate') }}</th>
                            <th>{{ t('credit.report.concept') }}</th>
                            <th class="vc-table__num">{{ t('credit.plan.interest') }}</th>
                            <th class="vc-table__num">{{ t('credit.plan.principalCol') }}</th>
                            <th class="vc-table__num">{{ t('credit.report.lateFee') }}</th>
                            <th class="vc-table__num">{{ t('credit.report.lineTotal') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in statement.items" :key="`${item.purchaseId}-${item.period}`">
                            <td>{{ fmtDate(item.dueDate) }}</td>
                            <td class="vc-table__strong">
                                {{ item.description }} · {{ t('credit.plan.installment') }} #{{ item.period }}
                                <span v-if="item.overdue" class="report-doc__overdue">{{ t('credit.report.overdue') }}</span>
                            </td>
                            <td class="vc-table__num">{{ formatCurrency(item.interest) }}</td>
                            <td class="vc-table__num">{{ formatCurrency(item.principal) }}</td>
                            <td class="vc-table__num">{{ formatCurrency(item.lateFee) }}</td>
                            <td class="vc-table__num">{{ formatCurrency(item.installment + item.lateFee) }}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr class="report-doc__totals">
                            <td colspan="2">{{ t('credit.report.total') }}</td>
                            <td class="vc-table__num">{{ formatCurrency(statement.totalInterest) }}</td>
                            <td class="vc-table__num">{{ formatCurrency(statement.totalPrincipal) }}</td>
                            <td class="vc-table__num">{{ formatCurrency(statement.totalLateFee) }}</td>
                            <td class="vc-table__num">{{ formatCurrency(statement.total) }}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </article>
    </div>
</template>

<style scoped>
.report-toolbar { display: flex; gap: 1rem; flex-wrap: wrap; }
.report-picker { max-width: 260px; }
.report-doc { padding: 1.5rem; }
.report-doc__head { margin-bottom: 1rem; }
.report-doc__title { margin: 0; font-size: 1.15rem; }
.report-doc__meta { margin: 0.3rem 0 0; font-size: 0.85rem; color: var(--vc-text-muted); }
.report-doc__overdue {
    display: inline-block;
    margin-left: 0.4rem;
    padding: 0.1rem 0.45rem;
    border-radius: 999px;
    background: var(--vc-danger-500);
    color: #fff;
    font-size: 0.72rem;
    font-weight: 600;
}
.report-doc__totals td {
    border-top: 2px solid var(--vc-border, rgba(0, 0, 0, 0.12));
    font-weight: 700;
    color: var(--vc-text);
}
</style>

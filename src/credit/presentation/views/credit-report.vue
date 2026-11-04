<script setup>

import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import useCreditStore from '@/credit/application/credit.store.js'
import useCustomersStore from '@/customers/application/customers.store.js'
import useIamStore from '@/iam/application/iam.store.js'
import { useStoreScope } from '@/iam/application/use-store-scope.js'
import { Roles } from '@/iam/domain/model/roles.js'
import { formatIn } from '@/shared/infrastructure/currency-formatter.js'
import { formatRate } from '@/credit/domain/services/finance.js'
import FieldHelp from '@/shared/presentation/components/field-help.vue'
import { sameId } from '@/shared/domain/same-id.js'
import { todayIsoDate } from '@/shared/domain/local-date.js'

const { t, locale } = useI18n()
const { scope } = useStoreScope()
const creditStore = useCreditStore()
const customersStore = useCustomersStore()
const iamStore = useIamStore()
const { customers } = storeToRefs(customersStore)
const { role, customerId } = storeToRefs(iamStore)

const isCustomerView = computed(() => role.value === Roles.CUSTOMER)
const scopedCustomers = computed(() => scope(customers.value))

const selectedCustomerId = ref('')
const referenceDate = ref(todayIsoDate())
const statement = ref(null)
const loading = ref(false)

const reportCustomerId = computed(() => (isCustomerView.value ? customerId.value : selectedCustomerId.value) || null)

const customerName = computed(() => {
    const customer = customers.value.find(c => sameId(c.id, reportCustomerId.value))
    return customer ? customer.fullName : iamStore.currentUser?.name
})

async function loadStatement() {
    statement.value = null
    if (!reportCustomerId.value || !referenceDate.value) return
    loading.value = true
    try {
        statement.value = await creditStore.fetchStatement(reportCustomerId.value, referenceDate.value)
    } finally {
        loading.value = false
    }
}

watch([reportCustomerId, referenceDate], loadStatement)

function formatCurrency(value) {
    return formatIn(value, statement.value?.currency)
}

function concept(line) {
    return line.months > 1
        ? t('credit.report.installmentOf', { description: line.description, period: line.period, months: line.months })
        : t('credit.report.singlePayment', { description: line.description })
}

function fmtDate(value) {
    if (!value) return '—'
    const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
    const date = new Date(y, (m || 1) - 1, d || 1)
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(locale.value)
}

onMounted(() => {
    if (!isCustomerView.value) customersStore.fetchCustomers()
    loadStatement()
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
                <span class="vc-field__label">{{ t('credit.field.customer') }}
                    <FieldHelp :tip="t('help.report.customer.tip')" />
                </span>
                <select v-model="selectedCustomerId" class="vc-select">
                    <option value="">{{ t('credit.selectCustomer') }}</option>
                    <option v-for="c in scopedCustomers" :key="c.id" :value="c.id">{{ c.fullName }}</option>
                </select>
                <small class="vc-field__hint">{{ t('help.report.customer.hint') }}</small>
            </label>
            <label class="vc-field report-picker">
                <span class="vc-field__label">{{ t('credit.report.cutoffDate') }}
                    <FieldHelp :tip="t('help.report.cutoffDate.tip')" />
                </span>
                <input v-model="referenceDate" type="date" class="vc-input" />
                <small class="vc-field__hint">{{ t('help.report.cutoffDate.hint') }}</small>
            </label>
        </div>

        <div v-if="!reportCustomerId" class="vc-card vc-state">
            <div class="vc-state__icon"><i class="pi pi-file" /></div>
            <p class="vc-state__title">{{ isCustomerView ? t('credit.report.unlinkedTitle') : t('credit.report.pickTitle') }}</p>
            <p class="vc-state__text">{{ isCustomerView ? t('credit.report.unlinkedText') : t('credit.report.pickText') }}</p>
        </div>

        <div v-else-if="loading" class="vc-card vc-state">
            <i class="pi pi-spin pi-spinner" />
        </div>

        <div v-else-if="!statement || !statement.lines.length" class="vc-card vc-state">
            <div class="vc-state__icon"><i class="pi pi-check-circle" /></div>
            <p class="vc-state__title">{{ t('credit.report.emptyTitle') }}</p>
            <p class="vc-state__text">{{ t('credit.report.emptyText') }}</p>
        </div>

        <article v-else class="vc-card report-doc">
            <header class="report-doc__head">
                <h2 class="report-doc__title">{{ t('credit.report.docTitle') }}</h2>
                <p class="report-doc__meta">
                    {{ customerName }} · {{ t('credit.report.cutoffDate') }}: {{ fmtDate(statement.cutoffDate) }}
                    · {{ t('credit.report.paymentDate') }}: {{ fmtDate(statement.paymentDate) }}
                </p>
            </header>

            <div class="vc-table-wrap">
                <table class="vc-table">
                    <thead>
                        <tr>
                            <th>{{ t('credit.plan.purchaseDate') }}</th>
                            <th>{{ t('credit.report.concept') }}</th>
                            <th>{{ t('credit.report.dueDate') }}</th>
                            <th class="vc-table__num">{{ t('credit.plan.interest') }}</th>
                            <th class="vc-table__num">{{ t('credit.plan.principalCol') }}</th>
                            <th class="vc-table__num">{{ t('credit.report.lineTotal') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="line in statement.lines" :key="`${line.purchaseId}-${line.period}`">
                            <td>{{ fmtDate(line.purchaseDate) }}</td>
                            <td class="vc-table__strong">{{ concept(line) }}</td>
                            <td>{{ fmtDate(line.dueDate) }}</td>
                            <td class="vc-table__num">{{ formatCurrency(line.interest) }}</td>
                            <td class="vc-table__num">{{ formatCurrency(line.principal) }}</td>
                            <td class="vc-table__num">{{ formatCurrency(line.total) }}</td>
                        </tr>
                    </tbody>
                    <tbody v-if="statement.lateFees.length">
                        <tr class="report-doc__section">
                            <td colspan="6">{{ t('credit.report.lateFeeTitle') }}</td>
                        </tr>
                        <tr v-for="fee in statement.lateFees" :key="`fee-${fee.purchaseId}-${fee.period}`">
                            <td>{{ fmtDate(fee.dueDate) }}</td>
                            <td class="vc-table__strong">
                                {{ t('credit.report.lateFeeConcept', { description: fee.description, days: fee.daysLate }) }}
                            </td>
                            <td>{{ t('credit.report.lateFeeRate') }}: {{ formatRate(fee.rate) }}</td>
                            <td class="vc-table__num">—</td>
                            <td class="vc-table__num">{{ t('credit.report.lateFeeBase') }}: {{ formatCurrency(fee.overdueAmount) }}</td>
                            <td class="vc-table__num">{{ formatCurrency(fee.amount) }}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr v-if="statement.lateFees.length">
                            <td colspan="5">{{ t('credit.report.lateFeeTotal') }}</td>
                            <td class="vc-table__num">{{ formatCurrency(statement.totalLateFee) }}</td>
                        </tr>
                        <tr class="report-doc__totals">
                            <td colspan="3">{{ t('credit.report.total') }}</td>
                            <td class="vc-table__num">{{ formatCurrency(statement.totalInterest) }}</td>
                            <td class="vc-table__num">{{ formatCurrency(statement.totalPrincipal) }}</td>
                            <td class="vc-table__num">{{ formatCurrency(statement.totalToPay) }}</td>
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
.report-doc__section td {
    padding-top: 1rem;
    font-weight: 700;
    color: var(--vc-danger-500);
}
.report-doc__totals td {
    border-top: 2px solid var(--vc-border, rgba(0, 0, 0, 0.12));
    font-weight: 700;
    color: var(--vc-text);
}
</style>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import useCreditStore from '@/credit/application/credit.store.js'
import useCustomersStore from '@/customers/application/customers.store.js'
import { useStoreScope } from '@/iam/application/use-store-scope.js'
import { useCurrencyFormatter } from '@/shared/infrastructure/currency-formatter.js'
import VcModal from '@/shared/presentation/components/vc-modal.vue'
import StatusBadge from '@/shared/presentation/components/status-badge.vue'

const { t } = useI18n()
const { format: formatCurrency } = useCurrencyFormatter()
const { scope, scopeStoreId } = useStoreScope()
const creditStore = useCreditStore()
const customersStore = useCustomersStore()
const { accounts, loading, error } = storeToRefs(creditStore)
const { customers } = storeToRefs(customersStore)

const scopedAccounts = computed(() => scope(accounts.value))
const totalOutstanding = computed(() =>
    scopedAccounts.value.reduce((sum, account) => sum + Number(account.balance || 0), 0))
const overdueAccounts = computed(() => scopedAccounts.value.filter(account => account.isOverdue))
const scopedCustomers = computed(() => scope(customers.value))

const accountModalOpen = ref(false)
const paymentModalOpen = ref(false)
const saving = ref(false)
const activeAccount = ref(null)

const blankAccount = () => ({
    customerId: '',
    storeId: '',
    balance: 0,
    creditLimit: 0,
    dueDate: '',
    state: 'current'
})
const accountForm = reactive(blankAccount())
const paymentForm = reactive({ amount: 0, date: new Date().toISOString().slice(0, 10) })

function customerName(id) {
    const c = customers.value.find(item => item.id === id || item.customerId === id)
    return c ? c.fullName : `#${id ?? '—'}`
}

const stateTone = { current: 'info', overdue: 'danger', paid: 'neutral' }

function fmtDate(value) {
    if (!value) return '—'
    const d = value instanceof Date ? value : new Date(value)
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

function openAccountModal() {
    Object.assign(accountForm, blankAccount())
    accountModalOpen.value = true
}

function openPaymentModal(account) {
    activeAccount.value = account
    paymentForm.amount = account.balance
    paymentForm.date = new Date().toISOString().slice(0, 10)
    paymentModalOpen.value = true
}

async function submitAccount() {
    saving.value = true
    try {
        await creditStore.openAccount({
            ...accountForm,
            storeId: accountForm.storeId || scopeStoreId.value || null,
            balance: Number(accountForm.balance) || 0,
            creditLimit: Number(accountForm.creditLimit) || 0,
            dueDate: accountForm.dueDate || null
        })
        accountModalOpen.value = false
    } catch (e) {
        error.value = e.message
    } finally {
        saving.value = false
    }
}

async function submitPayment() {
    saving.value = true
    try {
        await creditStore.registerPayment({
            creditId: activeAccount.value.creditId ?? activeAccount.value.id,
            customerId: activeAccount.value.customerId,
            amount: Number(paymentForm.amount) || 0,
            date: paymentForm.date
        })
        paymentModalOpen.value = false
    } catch (e) {
        error.value = e.message
    } finally {
        saving.value = false
    }
}

onMounted(() => {
    creditStore.fetchAccounts()
    customersStore.fetchCustomers()
})
</script>

<template>
    <div class="vc-page">
        <div class="vc-page__head">
            <div class="vc-page__head-text">
                <h1 class="vc-page__title">{{ t('nav.credit') }}</h1>
                <p class="vc-page__subtitle">{{ t('credit.subtitle') }}</p>
            </div>
            <button class="vc-btn vc-btn--primary" @click="openAccountModal">
                <i class="pi pi-plus" /> {{ t('credit.new') }}
            </button>
        </div>

        <section class="credit-kpis">
            <article class="vc-card credit-kpi">
                <span class="credit-kpi__label">{{ t('credit.totalOutstanding') }}</span>
                <span class="credit-kpi__value">{{ formatCurrency(totalOutstanding) }}</span>
            </article>
            <article class="vc-card credit-kpi">
                <span class="credit-kpi__label">{{ t('credit.activeAccounts') }}</span>
                <span class="credit-kpi__value">{{ scopedAccounts.length }}</span>
            </article>
            <article class="vc-card credit-kpi">
                <span class="credit-kpi__label">{{ t('credit.overdue') }}</span>
                <span class="credit-kpi__value credit-kpi__value--danger">{{ overdueAccounts.length }}</span>
            </article>
        </section>

        <div v-if="loading" class="vc-card vc-state">
            <i class="pi pi-spinner vc-spin vc-state__icon" />
            <p class="vc-state__text">{{ t('common.loading') }}</p>
        </div>

        <div v-else-if="error" class="vc-card vc-state">
            <div class="vc-state__icon"><i class="pi pi-exclamation-triangle" /></div>
            <p class="vc-state__title">{{ t('common.error') }}</p>
            <p class="vc-state__text">{{ error }}</p>
            <button class="vc-btn vc-btn--ghost" @click="creditStore.fetchAccounts()">{{ t('common.retry') }}</button>
        </div>

        <div v-else-if="!scopedAccounts.length" class="vc-card vc-state">
            <div class="vc-state__icon"><i class="pi pi-credit-card" /></div>
            <p class="vc-state__title">{{ t('credit.emptyTitle') }}</p>
            <p class="vc-state__text">{{ t('credit.emptyText') }}</p>
            <button class="vc-btn vc-btn--primary" @click="openAccountModal">
                <i class="pi pi-plus" /> {{ t('credit.new') }}
            </button>
        </div>

        <div v-else class="vc-table-wrap">
            <table class="vc-table">
                <thead>
                    <tr>
                        <th>{{ t('credit.field.customer') }}</th>
                        <th class="vc-table__num">{{ t('credit.field.balance') }}</th>
                        <th class="vc-table__num">{{ t('credit.field.available') }}</th>
                        <th>{{ t('credit.field.dueDate') }}</th>
                        <th>{{ t('common.state') }}</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="account in scopedAccounts" :key="account.id">
                        <td class="vc-table__strong">{{ customerName(account.customerId) }}</td>
                        <td class="vc-table__num">{{ formatCurrency(account.balance) }}</td>
                        <td class="vc-table__num">{{ formatCurrency(account.availableCredit) }}</td>
                        <td>{{ fmtDate(account.dueDate) }}</td>
                        <td>
                            <StatusBadge
                                :tone="stateTone[account.state] || 'neutral'"
                                :label="t(`credit.state.${account.state}`, account.state)"
                            />
                        </td>
                        <td class="vc-table__actions">
                            <button class="vc-btn vc-btn--ghost vc-btn--sm" @click="openPaymentModal(account)">
                                <i class="pi pi-wallet" /> {{ t('credit.registerPayment') }}
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- New account modal -->
        <VcModal :open="accountModalOpen" :title="t('credit.new')" @close="!saving && (accountModalOpen = false)">
            <form id="account-form" class="vc-form-grid" @submit.prevent="submitAccount">
                <label class="vc-field vc-field--full">
                    <span class="vc-field__label">{{ t('credit.field.customer') }}</span>
                    <select v-model="accountForm.customerId" class="vc-select" required>
                        <option value="" disabled>{{ t('credit.selectCustomer') }}</option>
                        <option v-for="c in scopedCustomers" :key="c.id" :value="c.id">{{ c.fullName }}</option>
                    </select>
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('credit.field.creditLimit') }}</span>
                    <input v-model="accountForm.creditLimit" type="number" min="0" step="0.01" class="vc-input" />
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('credit.field.balance') }}</span>
                    <input v-model="accountForm.balance" type="number" min="0" step="0.01" class="vc-input" />
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('credit.field.dueDate') }}</span>
                    <input v-model="accountForm.dueDate" type="date" class="vc-input" />
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('common.state') }}</span>
                    <select v-model="accountForm.state" class="vc-select">
                        <option value="current">{{ t('credit.state.current') }}</option>
                        <option value="overdue">{{ t('credit.state.overdue') }}</option>
                        <option value="paid">{{ t('credit.state.paid') }}</option>
                    </select>
                </label>
            </form>
            <template #footer>
                <button class="vc-btn vc-btn--ghost" type="button" @click="accountModalOpen = false">{{ t('common.cancel') }}</button>
                <button class="vc-btn vc-btn--primary" type="submit" form="account-form" :disabled="saving">
                    <i v-if="saving" class="pi pi-spinner vc-spin" />
                    {{ t('common.save') }}
                </button>
            </template>
        </VcModal>

        <!-- Register payment modal -->
        <VcModal :open="paymentModalOpen" :title="t('credit.registerPayment')" @close="!saving && (paymentModalOpen = false)">
            <p v-if="activeAccount" class="credit-payment__ctx">
                {{ customerName(activeAccount.customerId) }} · {{ t('credit.field.balance') }}:
                <strong>{{ formatCurrency(activeAccount.balance) }}</strong>
            </p>
            <form id="payment-form" class="vc-form-grid" @submit.prevent="submitPayment">
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('credit.field.amount') }}</span>
                    <input v-model="paymentForm.amount" type="number" min="0" step="0.01" class="vc-input" required />
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('credit.field.date') }}</span>
                    <input v-model="paymentForm.date" type="date" class="vc-input" required />
                </label>
            </form>
            <template #footer>
                <button class="vc-btn vc-btn--ghost" type="button" @click="paymentModalOpen = false">{{ t('common.cancel') }}</button>
                <button class="vc-btn vc-btn--primary" type="submit" form="payment-form" :disabled="saving">
                    <i v-if="saving" class="pi pi-spinner vc-spin" />
                    {{ t('credit.registerPayment') }}
                </button>
            </template>
        </VcModal>
    </div>
</template>

<style scoped>
.credit-kpis {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
}
.credit-kpi { display: flex; flex-direction: column; gap: 0.3rem; padding: 1.1rem 1.25rem; }
.credit-kpi__label { font-size: 0.82rem; color: var(--vc-text-muted); }
.credit-kpi__value { font-size: 1.5rem; font-weight: 700; color: var(--vc-text); }
.credit-kpi__value--danger { color: var(--vc-danger-500); }
.credit-payment__ctx {
    margin: 0 0 1rem;
    padding: 0.7rem 0.9rem;
    border-radius: 10px;
    background: var(--vc-surface-2);
    color: var(--vc-text-muted);
    font-size: 0.9rem;
}
</style>

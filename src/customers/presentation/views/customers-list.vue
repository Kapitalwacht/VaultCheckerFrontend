<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import useCustomersStore from '@/customers/application/customers.store.js'
import { useStoreScope } from '@/iam/application/use-store-scope.js'
import { useCurrencyFormatter } from '@/shared/infrastructure/currency-formatter.js'
import VcModal from '@/shared/presentation/components/vc-modal.vue'
import StatusBadge from '@/shared/presentation/components/status-badge.vue'

const { t } = useI18n()
const { format: formatCurrency } = useCurrencyFormatter()
const { scope, scopeStoreId } = useStoreScope()
const customersStore = useCustomersStore()
const { customers, loading, error } = storeToRefs(customersStore)

const CURRENCIES = ['PEN', 'USD']
const RATE_TYPES = ['effective', 'nominal']
const CAPITALIZATIONS = [
    { days: 1, label: 'daily' },
    { days: 30, label: 'monthly' },
    { days: 90, label: 'quarterly' },
    { days: 180, label: 'biannual' },
    { days: 360, label: 'annual' }
]

const search = ref('')
const modalOpen = ref(false)
const editingId = ref(null)
const saving = ref(false)

const blankForm = () => ({
    storeId: '',
    firstName: '',
    lastName: '',
    dni: '',
    phone: '',
    address: '',
    creditLimit: 0,
    currency: 'PEN',
    rateType: 'effective',
    ratePercent: 0,
    rateCapitalizationDays: 30,
    ratePeriodDays: 360,
    moratoriumRateType: 'effective',
    moratoriumRatePercent: 0,
    maxMonths: 1,
    cutoffDay: 1,
    paymentDay: 1,
    state: 'active'
})
const form = reactive(blankForm())

const filtered = computed(() => {
    const base = scope(customers.value)
    const q = search.value.trim().toLowerCase()
    if (!q) return base
    return base.filter(c =>
        [c.fullName, c.dni, c.phone].some(v => (v || '').toLowerCase().includes(q))
    )
})

function formatRate(customer) {
    const percent = (Number(customer.rateValue) || 0) * 100
    return `${percent.toFixed(2)}% ${t(`customers.rateType.${customer.rateType}`, customer.rateType)}`
}

function openCreate() {
    editingId.value = null
    Object.assign(form, blankForm())
    modalOpen.value = true
}

function openEdit(customer) {
    editingId.value = customer.id
    Object.assign(form, {
        storeId: customer.storeId ?? '',
        firstName: customer.firstName,
        lastName: customer.lastName,
        dni: customer.dni,
        phone: customer.phone,
        address: customer.address,
        creditLimit: customer.creditLimit,
        currency: customer.currency ?? 'PEN',
        rateType: customer.rateType ?? 'effective',
        ratePercent: (Number(customer.rateValue) || 0) * 100,
        rateCapitalizationDays: customer.rateCapitalizationDays ?? 30,
        ratePeriodDays: customer.ratePeriodDays ?? 360,
        moratoriumRateType: customer.moratoriumRateType ?? 'effective',
        moratoriumRatePercent: (Number(customer.moratoriumRateValue) || 0) * 100,
        maxMonths: customer.maxMonths ?? 1,
        cutoffDay: customer.cutoffDay ?? 1,
        paymentDay: customer.paymentDay ?? 1,
        state: customer.state
    })
    modalOpen.value = true
}

function closeModal() {
    if (saving.value) return
    modalOpen.value = false
}

async function submit() {
    saving.value = true
    try {
        const payload = {
            storeId: form.storeId || scopeStoreId.value || null,
            firstName: form.firstName,
            lastName: form.lastName,
            dni: form.dni,
            phone: form.phone,
            address: form.address,
            state: form.state,
            creditLimit: Number(form.creditLimit) || 0,
            currency: form.currency,
            rateType: form.rateType,
            rateValue: (Number(form.ratePercent) || 0) / 100,
            rateCapitalizationDays: Number(form.rateCapitalizationDays) || 30,
            ratePeriodDays: Number(form.ratePeriodDays) || 360,
            moratoriumRateType: form.moratoriumRateType,
            moratoriumRateValue: (Number(form.moratoriumRatePercent) || 0) / 100,
            maxMonths: Number(form.maxMonths) || 1,
            cutoffDay: Number(form.cutoffDay) || 1,
            paymentDay: Number(form.paymentDay) || 1
        }
        if (editingId.value) await customersStore.updateCustomer(editingId.value, payload)
        else await customersStore.createCustomer(payload)
        modalOpen.value = false
    } catch (e) {
        error.value = e.message
    } finally {
        saving.value = false
    }
}

async function remove(customer) {
    if (!window.confirm(t('customers.confirmDelete', { name: customer.fullName }))) return
    await customersStore.deleteCustomer(customer.id)
}

onMounted(() => customersStore.fetchCustomers())
</script>

<template>
    <div class="vc-page">
        <div class="vc-page__head">
            <div class="vc-page__head-text">
                <h1 class="vc-page__title">{{ t('nav.customers') }}</h1>
                <p class="vc-page__subtitle">{{ t('customers.subtitle') }}</p>
            </div>
            <button class="vc-btn vc-btn--primary" @click="openCreate">
                <i class="pi pi-plus" /> {{ t('customers.new') }}
            </button>
        </div>

        <div class="vc-toolbar">
            <label class="vc-search">
                <i class="pi pi-search" />
                <input v-model="search" type="search" :placeholder="t('common.search')" />
            </label>
        </div>

        <div v-if="loading" class="vc-card vc-state">
            <i class="pi pi-spinner vc-spin vc-state__icon" />
            <p class="vc-state__text">{{ t('common.loading') }}</p>
        </div>

        <div v-else-if="error" class="vc-card vc-state">
            <div class="vc-state__icon"><i class="pi pi-exclamation-triangle" /></div>
            <p class="vc-state__title">{{ t('common.error') }}</p>
            <p class="vc-state__text">{{ error }}</p>
            <button class="vc-btn vc-btn--ghost" @click="customersStore.fetchCustomers()">{{ t('common.retry') }}</button>
        </div>

        <div v-else-if="!filtered.length" class="vc-card vc-state">
            <div class="vc-state__icon"><i class="pi pi-users" /></div>
            <p class="vc-state__title">{{ t('customers.emptyTitle') }}</p>
            <p class="vc-state__text">{{ t('customers.emptyText') }}</p>
            <button class="vc-btn vc-btn--primary" @click="openCreate">
                <i class="pi pi-plus" /> {{ t('customers.new') }}
            </button>
        </div>

        <div v-else class="vc-table-wrap">
            <table class="vc-table">
                <thead>
                    <tr>
                        <th>{{ t('customers.field.name') }}</th>
                        <th>{{ t('customers.field.dni') }}</th>
                        <th class="vc-table__num">{{ t('customers.field.creditLimit') }}</th>
                        <th>{{ t('customers.field.rate') }}</th>
                        <th>{{ t('common.state') }}</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="customer in filtered" :key="customer.id">
                        <td class="vc-table__strong">{{ customer.fullName }}</td>
                        <td>{{ customer.dni }}</td>
                        <td class="vc-table__num">{{ formatCurrency(customer.creditLimit) }}</td>
                        <td>{{ formatRate(customer) }}</td>
                        <td>
                            <StatusBadge
                                :tone="customer.isActive ? 'success' : 'neutral'"
                                :label="customer.isActive ? t('common.active') : t('common.inactive')"
                            />
                        </td>
                        <td class="vc-table__actions">
                            <button class="vc-btn vc-btn--ghost vc-btn--sm vc-btn--icon" :title="t('common.edit')" @click="openEdit(customer)">
                                <i class="pi pi-pencil" />
                            </button>
                            <button class="vc-btn vc-btn--danger vc-btn--sm vc-btn--icon" :title="t('common.delete')" @click="remove(customer)">
                                <i class="pi pi-trash" />
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <VcModal :open="modalOpen" :title="editingId ? t('customers.edit') : t('customers.new')" @close="closeModal">
            <form id="customer-form" class="vc-form-grid" @submit.prevent="submit">
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('customers.field.firstName') }}</span>
                    <input v-model="form.firstName" class="vc-input" required />
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('customers.field.lastName') }}</span>
                    <input v-model="form.lastName" class="vc-input" required />
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('customers.field.dni') }}</span>
                    <input v-model="form.dni" class="vc-input" />
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('customers.field.phone') }}</span>
                    <input v-model="form.phone" class="vc-input" />
                </label>
                <label class="vc-field vc-field--full">
                    <span class="vc-field__label">{{ t('customers.field.address') }}</span>
                    <input v-model="form.address" class="vc-input" />
                </label>

                <p class="vc-form-section">{{ t('customers.section.credit') }}</p>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('customers.field.creditLimit') }}</span>
                    <input v-model="form.creditLimit" type="number" min="0" step="0.01" class="vc-input" />
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('customers.field.currency') }}</span>
                    <select v-model="form.currency" class="vc-select">
                        <option v-for="c in CURRENCIES" :key="c" :value="c">{{ c }}</option>
                    </select>
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('customers.field.maxMonths') }}</span>
                    <input v-model="form.maxMonths" type="number" min="1" step="1" class="vc-input" />
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('customers.field.cutoffDay') }}</span>
                    <input v-model="form.cutoffDay" type="number" min="1" max="31" step="1" class="vc-input" />
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('customers.field.paymentDay') }}</span>
                    <input v-model="form.paymentDay" type="number" min="1" max="31" step="1" class="vc-input" />
                </label>

                <p class="vc-form-section">{{ t('customers.section.rates') }}</p>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('customers.field.rateType') }}</span>
                    <select v-model="form.rateType" class="vc-select">
                        <option v-for="rt in RATE_TYPES" :key="rt" :value="rt">{{ t(`customers.rateType.${rt}`) }}</option>
                    </select>
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('customers.field.rateValue') }}</span>
                    <input v-model="form.ratePercent" type="number" min="0" step="0.0000001" class="vc-input" />
                </label>
                <label v-if="form.rateType === 'nominal'" class="vc-field">
                    <span class="vc-field__label">{{ t('customers.field.capitalization') }}</span>
                    <select v-model.number="form.rateCapitalizationDays" class="vc-select">
                        <option v-for="cap in CAPITALIZATIONS" :key="cap.days" :value="cap.days">
                            {{ t(`customers.capitalization.${cap.label}`) }}
                        </option>
                    </select>
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('customers.field.moratoriumRateType') }}</span>
                    <select v-model="form.moratoriumRateType" class="vc-select">
                        <option v-for="rt in RATE_TYPES" :key="rt" :value="rt">{{ t(`customers.rateType.${rt}`) }}</option>
                    </select>
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('customers.field.moratoriumRateValue') }}</span>
                    <input v-model="form.moratoriumRatePercent" type="number" min="0" step="0.0000001" class="vc-input" />
                </label>

                <label class="vc-field">
                    <span class="vc-field__label">{{ t('common.state') }}</span>
                    <select v-model="form.state" class="vc-select">
                        <option value="active">{{ t('common.active') }}</option>
                        <option value="inactive">{{ t('common.inactive') }}</option>
                    </select>
                </label>
            </form>

            <template #footer>
                <button class="vc-btn vc-btn--ghost" type="button" @click="closeModal">{{ t('common.cancel') }}</button>
                <button class="vc-btn vc-btn--primary" type="submit" form="customer-form" :disabled="saving">
                    <i v-if="saving" class="pi pi-spinner vc-spin" />
                    {{ t('common.save') }}
                </button>
            </template>
        </VcModal>
    </div>
</template>

<style scoped>
.vc-form-section {
    grid-column: 1 / -1;
    margin: 0.5rem 0 0;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--vc-text-muted);
}
</style>

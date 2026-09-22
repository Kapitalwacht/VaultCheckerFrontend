<script setup>

import { ref, computed, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import useCatalogStore from '@/catalog/application/catalog.store.js'
import { useStoreScope } from '@/iam/application/use-store-scope.js'
import { useCurrencyFormatter } from '@/shared/infrastructure/currency-formatter.js'
import VcModal from '@/shared/presentation/components/vc-modal.vue'
import StatusBadge from '@/shared/presentation/components/status-badge.vue'

const { t } = useI18n()
const { format: formatCurrency } = useCurrencyFormatter()
const { scope, scopeStoreId } = useStoreScope()
const catalogStore = useCatalogStore()
const { products, loading, error } = storeToRefs(catalogStore)

const UNITS = ['unit', 'kg', 'g', 'l', 'ml', 'pack', 'box', 'dozen']
const PAYMENT_MODES = ['both', 'single', 'installments']

const search = ref('')
const modalOpen = ref(false)
const editingId = ref(null)
const saving = ref(false)

const blankForm = () => ({
    storeId: '',
    name: '',
    category: '',
    brand: '',
    unit: 'unit',
    cashPrice: 0,
    listPrice: 0,
    paymentMode: 'both',
    imageUrl: '',
    state: 'active'
})
const form = reactive(blankForm())

const filtered = computed(() => {
    const base = scope(products.value)
    const q = search.value.trim().toLowerCase()
    if (!q) return base
    return base.filter(p =>
        [p.name, p.category, p.brand].some(v => (v || '').toLowerCase().includes(q))
    )
})

function openCreate() {
    editingId.value = null
    Object.assign(form, blankForm())
    modalOpen.value = true
}

function openEdit(product) {
    editingId.value = product.id
    Object.assign(form, {
        storeId: product.storeId ?? '',
        name: product.name,
        category: product.category,
        brand: product.brand ?? '',
        unit: product.unit,
        cashPrice: product.cashPrice,
        listPrice: product.listPrice,
        paymentMode: product.paymentMode ?? 'both',
        imageUrl: product.imageUrl ?? '',
        state: product.state
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
            ...form,
            storeId: form.storeId || scopeStoreId.value || null,
            cashPrice: Number(form.cashPrice) || 0,
            listPrice: Number(form.listPrice) || 0
        }
        if (editingId.value) await catalogStore.updateProduct(editingId.value, payload)
        else await catalogStore.createProduct(payload)
        modalOpen.value = false
    } catch (e) {
        error.value = e.message
    } finally {
        saving.value = false
    }
}

async function remove(product) {
    if (!window.confirm(t('catalog.confirmDelete', { name: product.name }))) return
    await catalogStore.deleteProduct(product.id)
}

onMounted(() => catalogStore.fetchProducts())

</script>

<template>
    <div class="vc-page">
        <div class="vc-page__head">
            <div class="vc-page__head-text">
                <h1 class="vc-page__title">{{ t('nav.catalog') }}</h1>
                <p class="vc-page__subtitle">{{ t('catalog.subtitle') }}</p>
            </div>
            <button class="vc-btn vc-btn--primary" @click="openCreate">
                <i class="pi pi-plus" /> {{ t('catalog.new') }}
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
            <button class="vc-btn vc-btn--ghost" @click="catalogStore.fetchProducts()">{{ t('common.retry') }}</button>
        </div>

        <div v-else-if="!filtered.length" class="vc-card vc-state">
            <div class="vc-state__icon"><i class="pi pi-box" /></div>
            <p class="vc-state__title">{{ t('catalog.emptyTitle') }}</p>
            <p class="vc-state__text">{{ t('catalog.emptyText') }}</p>
            <button class="vc-btn vc-btn--primary" @click="openCreate">
                <i class="pi pi-plus" /> {{ t('catalog.new') }}
            </button>
        </div>

        <div v-else class="vc-table-wrap">
            <table class="vc-table">
                <thead>
                    <tr>
                        <th>{{ t('catalog.field.name') }}</th>
                        <th>{{ t('catalog.field.category') }}</th>
                        <th class="vc-table__num">{{ t('catalog.field.cashPrice') }}</th>
                        <th class="vc-table__num">{{ t('catalog.field.listPrice') }}</th>
                        <th>{{ t('catalog.field.paymentMode') }}</th>
                        <th>{{ t('common.state') }}</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="product in filtered" :key="product.id">
                        <td class="vc-table__strong">{{ product.name }}</td>
                        <td>{{ product.category }}</td>
                        <td class="vc-table__num">{{ formatCurrency(product.cashPrice) }}</td>
                        <td class="vc-table__num">{{ formatCurrency(product.listPrice) }}</td>
                        <td>{{ t(`catalog.paymentMode.${product.paymentMode}`, product.paymentMode) }}</td>
                        <td>
                            <StatusBadge
                                :tone="product.state === 'active' ? 'success' : 'neutral'"
                                :label="product.state === 'active' ? t('common.active') : t('common.inactive')"
                            />
                        </td>
                        <td class="vc-table__actions">
                            <button class="vc-btn vc-btn--ghost vc-btn--sm vc-btn--icon" :title="t('common.edit')" @click="openEdit(product)">
                                <i class="pi pi-pencil" />
                            </button>
                            <button class="vc-btn vc-btn--danger vc-btn--sm vc-btn--icon" :title="t('common.delete')" @click="remove(product)">
                                <i class="pi pi-trash" />
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <VcModal :open="modalOpen" :title="editingId ? t('catalog.edit') : t('catalog.new')" @close="closeModal">
            <form id="product-form" class="vc-form-grid" @submit.prevent="submit">
                <label class="vc-field vc-field--full">
                    <span class="vc-field__label">{{ t('catalog.field.name') }}</span>
                    <input v-model="form.name" class="vc-input" required />
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('catalog.field.category') }}</span>
                    <input v-model="form.category" class="vc-input" />
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('catalog.field.brand') }}</span>
                    <input v-model="form.brand" class="vc-input" />
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('catalog.field.unit') }}</span>
                    <select v-model="form.unit" class="vc-select">
                        <option v-for="u in UNITS" :key="u" :value="u">{{ t(`catalog.unit.${u}`, u) }}</option>
                    </select>
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('catalog.field.paymentMode') }}</span>
                    <select v-model="form.paymentMode" class="vc-select">
                        <option v-for="m in PAYMENT_MODES" :key="m" :value="m">{{ t(`catalog.paymentMode.${m}`) }}</option>
                    </select>
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('catalog.field.cashPrice') }}</span>
                    <input v-model="form.cashPrice" type="number" min="0" step="0.01" class="vc-input" required />
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('catalog.field.listPrice') }}</span>
                    <input v-model="form.listPrice" type="number" min="0" step="0.01" class="vc-input" required />
                </label>
                <label class="vc-field vc-field--full">
                    <span class="vc-field__label">{{ t('catalog.field.imageUrl') }}</span>
                    <input v-model="form.imageUrl" class="vc-input" />
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
                <button class="vc-btn vc-btn--primary" type="submit" form="product-form" :disabled="saving">
                    <i v-if="saving" class="pi pi-spinner vc-spin" />
                    {{ t('common.save') }}
                </button>
            </template>
        </VcModal>
    </div>
</template>

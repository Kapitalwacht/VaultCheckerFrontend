<script setup>

import { ref, computed, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import useStoresStore from '@/stores/application/stores.store.js'
import VcModal from '@/shared/presentation/components/vc-modal.vue'
import StatusBadge from '@/shared/presentation/components/status-badge.vue'

const { t } = useI18n()
const storesStore = useStoresStore()
const { stores, loading, error } = storeToRefs(storesStore)

const search = ref('')
const modalOpen = ref(false)
const editingId = ref(null)
const saving = ref(false)

const blankForm = () => ({
    storeId: '',
    ruc: '',
    businessName: '',
    category: '',
    address: '',
    phone: '',
    email: '',
    description: '',
    state: 'active'
})
const form = reactive(blankForm())

const filtered = computed(() => {
    const q = search.value.trim().toLowerCase()
    if (!q) return stores.value
    return stores.value.filter(s =>
        [s.businessName, s.ruc, s.category, s.email].some(v => (v || '').toLowerCase().includes(q))
    )
})

function openCreate() {
    editingId.value = null
    Object.assign(form, blankForm())
    modalOpen.value = true
}

function openEdit(store) {
    editingId.value = store.id
    Object.assign(form, {
        storeId: store.storeId ?? '',
        ruc: store.ruc,
        businessName: store.businessName,
        category: store.category,
        address: store.address,
        phone: store.phone,
        email: store.email,
        description: store.description,
        state: store.state
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
        if (editingId.value) await storesStore.updateStore(editingId.value, { ...form })
        else await storesStore.createStore({ ...form })
        modalOpen.value = false
    } catch (e) {
        error.value = e.message
    } finally {
        saving.value = false
    }
}

async function toggleState(store) {
    const nextState = store.isActive ? 'inactive' : 'active'
    await storesStore.updateStore(store.id, { ...store, state: nextState })
}

onMounted(() => storesStore.fetchStores())

</script>

<template>
    <div class="vc-page">
        <div class="vc-page__head">
            <div class="vc-page__head-text">
                <h1 class="vc-page__title">{{ t('nav.stores') }}</h1>
                <p class="vc-page__subtitle">{{ t('stores.subtitle') }}</p>
            </div>
            <button class="vc-btn vc-btn--primary" @click="openCreate">
                <i class="pi pi-plus" /> {{ t('stores.new') }}
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
            <button class="vc-btn vc-btn--ghost" @click="storesStore.fetchStores()">{{ t('common.retry') }}</button>
        </div>

        <div v-else-if="!filtered.length" class="vc-card vc-state">
            <div class="vc-state__icon"><i class="pi pi-building" /></div>
            <p class="vc-state__title">{{ t('stores.emptyTitle') }}</p>
            <p class="vc-state__text">{{ t('stores.emptyText') }}</p>
            <button class="vc-btn vc-btn--primary" @click="openCreate">
                <i class="pi pi-plus" /> {{ t('stores.new') }}
            </button>
        </div>

        <div v-else class="vc-table-wrap">
            <table class="vc-table">
                <thead>
                    <tr>
                        <th>{{ t('stores.field.businessName') }}</th>
                        <th>{{ t('stores.field.ruc') }}</th>
                        <th>{{ t('stores.field.category') }}</th>
                        <th>{{ t('stores.field.phone') }}</th>
                        <th>{{ t('common.state') }}</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="store in filtered" :key="store.id">
                        <td class="vc-table__strong">{{ store.businessName }}</td>
                        <td>{{ store.ruc }}</td>
                        <td>{{ store.category }}</td>
                        <td>{{ store.phone }}</td>
                        <td>
                            <StatusBadge
                                :tone="store.isActive ? 'success' : 'neutral'"
                                :label="store.isActive ? t('common.active') : t('common.inactive')"
                            />
                        </td>
                        <td class="vc-table__actions">
                            <button class="vc-btn vc-btn--ghost vc-btn--sm vc-btn--icon" :title="t('common.edit')" @click="openEdit(store)">
                                <i class="pi pi-pencil" />
                            </button>
                            <button
                                class="vc-btn vc-btn--ghost vc-btn--sm vc-btn--icon"
                                :title="store.isActive ? t('common.deactivate') : t('common.activate')"
                                @click="toggleState(store)"
                            >
                                <i :class="store.isActive ? 'pi pi-ban' : 'pi pi-check-circle'" />
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <VcModal :open="modalOpen" :title="editingId ? t('stores.edit') : t('stores.new')" @close="closeModal">
            <form id="store-form" class="vc-form-grid" @submit.prevent="submit">
                <label class="vc-field vc-field--full">
                    <span class="vc-field__label">{{ t('stores.field.businessName') }}</span>
                    <input v-model="form.businessName" class="vc-input" required />
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('stores.field.ruc') }}</span>
                    <input v-model="form.ruc" class="vc-input" />
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('stores.field.category') }}</span>
                    <input v-model="form.category" class="vc-input" :placeholder="t('stores.categoryHint')" />
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('stores.field.phone') }}</span>
                    <input v-model="form.phone" class="vc-input" />
                </label>
                <label class="vc-field">
                    <span class="vc-field__label">{{ t('stores.field.email') }}</span>
                    <input v-model="form.email" type="email" class="vc-input" />
                </label>
                <label class="vc-field vc-field--full">
                    <span class="vc-field__label">{{ t('stores.field.address') }}</span>
                    <input v-model="form.address" class="vc-input" />
                </label>
                <label class="vc-field vc-field--full">
                    <span class="vc-field__label">{{ t('stores.field.description') }}</span>
                    <textarea v-model="form.description" class="vc-textarea" />
                </label>
            </form>

            <template #footer>
                <button class="vc-btn vc-btn--ghost" type="button" @click="closeModal">{{ t('common.cancel') }}</button>
                <button class="vc-btn vc-btn--primary" type="submit" form="store-form" :disabled="saving">
                    <i v-if="saving" class="pi pi-spinner vc-spin" />
                    {{ t('common.save') }}
                </button>
            </template>
        </VcModal>
    </div>
</template>

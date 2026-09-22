<script setup>

import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import useAuditStore from '@/audit/application/audit.store.js'
import StatusBadge from '@/shared/presentation/components/status-badge.vue'

const { t } = useI18n()
const auditStore = useAuditStore()
const { logs, loading, error } = storeToRefs(auditStore)

const dateFilter = ref('')

const filtered = computed(() => {
    if (!dateFilter.value) return logs.value
    return logs.value.filter(log => log.date === dateFilter.value)
})

const actionTone = { CREATE: 'success', UPDATE: 'info', DELETE: 'danger', PAYMENT: 'accent' }
function toneFor(action) {
    const key = (action || '').split('_')[0].toUpperCase()
    return actionTone[key] || 'neutral'
}

onMounted(() => auditStore.fetchLogs())

</script>

<template>
    <div class="vc-page">
        <div class="vc-page__head">
            <div class="vc-page__head-text">
                <h1 class="vc-page__title">{{ t('nav.audit') }}</h1>
                <p class="vc-page__subtitle">{{ t('audit.subtitle') }}</p>
            </div>
        </div>

        <div class="vc-toolbar">
            <label class="vc-field audit-date">
                <span class="vc-field__label">{{ t('audit.filterByDate') }}</span>
                <input v-model="dateFilter" type="date" class="vc-input" />
            </label>
            <button v-if="dateFilter" class="vc-btn vc-btn--ghost" @click="dateFilter = ''">
                <i class="pi pi-filter-slash" /> {{ t('audit.clearFilter') }}
            </button>
        </div>

        <div v-if="loading" class="vc-card vc-state">
            <i class="pi pi-spinner vc-spin vc-state__icon" />
            <p class="vc-state__text">{{ t('common.loading') }}</p>
        </div>

        <div v-else-if="error" class="vc-card vc-state">
            <div class="vc-state__icon"><i class="pi pi-exclamation-triangle" /></div>
            <p class="vc-state__title">{{ t('common.error') }}</p>
            <p class="vc-state__text">{{ error }}</p>
            <button class="vc-btn vc-btn--ghost" @click="auditStore.fetchLogs()">{{ t('common.retry') }}</button>
        </div>

        <div v-else-if="!filtered.length" class="vc-card vc-state">
            <div class="vc-state__icon"><i class="pi pi-history" /></div>
            <p class="vc-state__title">{{ t('audit.emptyTitle') }}</p>
            <p class="vc-state__text">{{ t('audit.emptyText') }}</p>
        </div>

        <div v-else class="vc-table-wrap">
            <table class="vc-table">
                <thead>
                    <tr>
                        <th>{{ t('audit.field.date') }}</th>
                        <th>{{ t('audit.field.time') }}</th>
                        <th>{{ t('audit.field.role') }}</th>
                        <th>{{ t('audit.field.action') }}</th>
                        <th>{{ t('audit.field.details') }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="log in filtered" :key="log.id">
                        <td>{{ log.date }}</td>
                        <td>{{ log.time }}</td>
                        <td>{{ log.userRole }}</td>
                        <td><StatusBadge :tone="toneFor(log.action)" :label="log.action" /></td>
                        <td>{{ log.details }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<style scoped>
.vc-toolbar { align-items: flex-end; }
.audit-date { gap: 0.35rem; }
.audit-date .vc-input { max-width: 200px; }
</style>

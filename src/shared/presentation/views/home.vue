<script setup>

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useCurrencyFormatter } from '@/shared/infrastructure/currency-formatter.js'

const { t } = useI18n()
const router = useRouter()
const { format } = useCurrencyFormatter()

const kpis = computed(() => [
    { key: 'outstanding', icon: 'pi-wallet',      value: format(0), tone: 'brand' },
    { key: 'customers',   icon: 'pi-users',        value: '0',       tone: 'info' },
    { key: 'dueSoon',     icon: 'pi-calendar',     value: '0',       tone: 'accent' },
    { key: 'overdue',     icon: 'pi-exclamation-triangle', value: format(0), tone: 'danger' }
])

const shortcuts = [
    { key: 'stores',    icon: 'pi-building',    to: '/stores' },
    { key: 'customers', icon: 'pi-users',       to: '/customers' },
    { key: 'catalog',   icon: 'pi-box',         to: '/catalog' },
    { key: 'credit',    icon: 'pi-credit-card', to: '/credit' }
]

function go(to) { router.push(to) }

</script>

<template>
    <div class="vc-page">
        <h1 class="vc-page__title">{{ t('home.title') }}</h1>
        <p class="vc-page__subtitle">{{ t('home.subtitle') }}</p>

        <section class="kpis">
            <article v-for="kpi in kpis" :key="kpi.key" class="vc-card kpi" :class="`kpi--${kpi.tone}`">
                <div class="kpi__icon"><i class="pi" :class="kpi.icon" /></div>
                <div class="kpi__body">
                    <span class="kpi__label">{{ t(`home.kpi.${kpi.key}`) }}</span>
                    <span class="kpi__value">{{ kpi.value }}</span>
                </div>
            </article>
        </section>

        <h2 class="section-title">{{ t('home.quickStart') }}</h2>
        <section class="shortcuts">
            <button
                v-for="s in shortcuts"
                :key="s.key"
                class="vc-card shortcut"
                @click="go(s.to)"
            >
                <i class="shortcut__icon pi" :class="s.icon" />
                <span class="shortcut__label">{{ t(`nav.${s.key}`) }}</span>
                <i class="shortcut__chevron pi pi-arrow-right" />
            </button>
        </section>
    </div>
</template>

<style scoped>
.kpis {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}
.kpi { display: flex; align-items: center; gap: 1rem; padding: 1.15rem 1.25rem; }
.kpi__icon {
    width: 46px; height: 46px; border-radius: 12px;
    display: grid; place-items: center; font-size: 1.3rem; flex: none;
}
.kpi--brand  .kpi__icon { background: rgba(22, 163, 74, 0.12); color: var(--vc-brand-500); }
.kpi--info   .kpi__icon { background: rgba(37, 99, 235, 0.12);  color: #2563eb; }
.kpi--accent .kpi__icon { background: rgba(217, 119, 6, 0.14);  color: var(--vc-accent-500); }
.kpi--danger .kpi__icon { background: rgba(220, 38, 38, 0.12);  color: var(--vc-danger-500); }
.kpi__body { display: flex; flex-direction: column; gap: 0.2rem; }
.kpi__label { font-size: 0.82rem; color: var(--vc-text-muted); }
.kpi__value { font-size: 1.4rem; font-weight: 700; color: var(--vc-text); }

.section-title { font-size: 1.05rem; font-weight: 700; margin: 0 0 0.9rem; color: var(--vc-text); }
.shortcuts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.85rem;
}
.shortcut {
    display: flex; align-items: center; gap: 0.8rem;
    padding: 1rem 1.1rem; cursor: pointer; font: inherit;
    color: var(--vc-text); text-align: left;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.shortcut:hover { transform: translateY(-2px); box-shadow: var(--vc-shadow-lg); }
.shortcut__icon { font-size: 1.2rem; color: var(--vc-brand-500); }
.shortcut__label { flex: 1; font-weight: 600; }
.shortcut__chevron { color: var(--vc-text-muted); font-size: 0.85rem; }
</style>

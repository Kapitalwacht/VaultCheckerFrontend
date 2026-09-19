<script setup>
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/i18n.js'

const { t, locale } = useI18n()

function toggle() {
    setLocale(locale.value === 'es' ? 'en' : 'es')
}
</script>

<template>
    <button type="button" class="locale-toggle" :aria-label="t('common.toggleLanguage')" @click="toggle">
        <i class="pi pi-globe" />
        <span>{{ locale === 'es' ? 'EN' : 'ES' }}</span>
    </button>
</template>

<style scoped>
.locale-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.7rem;
    border: 1px solid var(--vc-border);
    border-radius: 999px;
    background: var(--vc-surface);
    color: var(--vc-text-muted);
    font: inherit;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 0.15s ease, color 0.15s ease;
}
.locale-toggle:hover { border-color: var(--vc-brand-500); color: var(--vc-brand-500); }
</style>

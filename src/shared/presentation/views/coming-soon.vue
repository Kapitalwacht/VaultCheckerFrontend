<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { t } = useI18n()
const route = useRoute()

const sectionLabel = computed(() => {
    const key = route.meta?.title
    return key ? t(key) : ''
})
</script>

<template>
    <div class="vc-page">
        <div class="vc-card coming">
            <div class="coming__icon"><i class="pi pi-wrench" /></div>
            <h1 class="coming__title">{{ sectionLabel || t('comingSoon.title') }}</h1>
            <p class="coming__text">{{ t('comingSoon.text') }}</p>
        </div>
    </div>
</template>

<style scoped>
.coming {
    padding: 3rem 2rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
}
.coming__icon {
    width: 64px; height: 64px; border-radius: 16px;
    display: grid; place-items: center;
    background: rgba(22, 163, 74, 0.12);
    color: var(--vc-brand-500);
    font-size: 1.7rem;
    margin-bottom: 0.25rem;
}
.coming__title { font-size: 1.4rem; font-weight: 700; margin: 0; color: var(--vc-text); }
.coming__text { color: var(--vc-text-muted); margin: 0; max-width: 32rem; }
</style>

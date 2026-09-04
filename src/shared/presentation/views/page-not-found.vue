<script setup>
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import BrandLogo from '@/shared/presentation/components/brand-logo.vue'

const { t } = useI18n()
const router = useRouter()
</script>

<template>
    <div class="notfound">
        <BrandLogo :size="34" class="notfound__brand" />
        <p class="notfound__code">404</p>
        <h1 class="notfound__title">{{ t('notFound.title') }}</h1>
        <p class="notfound__text">{{ t('notFound.text') }}</p>
        <button class="notfound__btn" @click="router.push('/home')">
            <i class="pi pi-home" /> {{ t('notFound.back') }}
        </button>
    </div>
</template>

<style scoped>
.notfound {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 2rem;
    background: var(--vc-bg);
    color: var(--vc-text);
}
.notfound__brand { color: var(--vc-brand-500); margin-bottom: 1rem; }
.notfound__code { font-size: 4rem; font-weight: 800; margin: 0; color: var(--vc-brand-500); line-height: 1; }
.notfound__title { font-size: 1.4rem; margin: 0.5rem 0 0; }
.notfound__text { color: var(--vc-text-muted); margin: 0 0 1.25rem; }
.notfound__btn {
    display: inline-flex; align-items: center; gap: 0.5rem;
    padding: 0.65rem 1.2rem; border: none; border-radius: 10px;
    background: var(--vc-brand-500); color: #fff; font: inherit; font-weight: 600;
    cursor: pointer;
}
.notfound__btn:hover { background: var(--vc-brand-600); }
</style>

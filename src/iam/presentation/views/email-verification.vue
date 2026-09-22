<script setup>

import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import BrandLogo from '@/shared/presentation/components/brand-logo.vue'
import LocaleToggle from '@/shared/presentation/components/locale-toggle.vue'
import useIamStore from '@/iam/application/iam.store.js'

const { t } = useI18n()
const route = useRoute()
const iamStore = useIamStore()

const status = ref('pending')
const userName = ref('')

onMounted(() => {
    const email = String(route.query.email || '')
    const token = String(route.query.token || '')
    if (!email || !token) {
        status.value = 'error'
        return
    }
    iamStore.verifyEmail(email, token)
        .then(name => {
            userName.value = name || ''
            status.value = 'success'
        })
        .catch(() => {
            status.value = 'error'
        })
})

</script>

<template>
    <div class="login">
        <div class="login__panel vc-card">
            <LocaleToggle class="login__locale" />
            <BrandLogo :size="34" class="login__brand" />

            <template v-if="status === 'pending'">
                <div class="verify__icon verify__icon--pending"><i class="pi pi-spin pi-spinner" /></div>
                <h1 class="login__title">{{ t('verify.pendingTitle') }}</h1>
                <p class="login__subtitle">{{ t('verify.pendingText') }}</p>
            </template>

            <template v-else-if="status === 'success'">
                <div class="verify__icon verify__icon--ok"><i class="pi pi-check-circle" /></div>
                <h1 class="login__title">{{ userName ? t('verify.welcomeTitle', { name: userName }) : t('verify.successTitle') }}</h1>
                <p class="login__subtitle">{{ t('verify.successText') }}</p>
                <RouterLink class="login__submit" :to="{ name: 'login' }">{{ t('verify.goToLogin') }}</RouterLink>
            </template>

            <template v-else>
                <div class="verify__icon verify__icon--error"><i class="pi pi-times-circle" /></div>
                <h1 class="login__title">{{ t('verify.errorTitle') }}</h1>
                <p class="login__subtitle">{{ t('verify.errorText') }}</p>
                <RouterLink class="login__submit" :to="{ name: 'login' }">{{ t('verify.goToLogin') }}</RouterLink>
            </template>
        </div>
    </div>
</template>

<style scoped>
.login {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 1.5rem;
    background:
        radial-gradient(1200px 600px at 100% -10%, rgba(22, 163, 74, 0.14), transparent 60%),
        var(--vc-bg);
}
.login__panel {
    position: relative;
    width: 100%;
    max-width: 400px;
    padding: 2.25rem 2rem;
    display: flex;
    flex-direction: column;
    text-align: center;
    box-sizing: border-box;
}
.login__locale { position: absolute; top: 1rem; right: 1rem; }
.login__brand { color: var(--vc-brand-500); margin-bottom: 1.25rem; align-self: center; }
.login__title { font-size: 1.4rem; font-weight: 700; margin: 0; color: var(--vc-text); }
.login__subtitle { color: var(--vc-text-muted); margin: 0.5rem 0 1.5rem; }
.verify__icon {
    align-self: center;
    display: grid; place-items: center;
    width: 64px; height: 64px; margin-bottom: 1rem;
    border-radius: 50%;
    font-size: 1.8rem;
}
.verify__icon--pending { background: rgba(22, 163, 74, 0.1); color: var(--vc-brand-500); }
.verify__icon--ok { background: rgba(22, 163, 74, 0.14); color: var(--vc-brand-600, var(--vc-brand-500)); }
.verify__icon--error { background: rgba(220, 38, 38, 0.12); color: var(--vc-danger-500); }
.login__submit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.8rem 1rem;
    border: none;
    border-radius: 10px;
    background: var(--vc-brand-500);
    color: #fff;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.15s ease;
}
.login__submit:hover { background: var(--vc-brand-600); }
</style>

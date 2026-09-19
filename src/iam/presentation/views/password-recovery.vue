<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import BrandLogo from '@/shared/presentation/components/brand-logo.vue'
import LocaleToggle from '@/shared/presentation/components/locale-toggle.vue'
import useIamStore from '@/iam/application/iam.store.js'

const { t } = useI18n()
const router = useRouter()
const iamStore = useIamStore()

const step = ref(1)
const email = ref('')
const code = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const demoCode = ref('')
const infoMessage = ref('')
const errorMessage = ref('')
const submitting = ref(false)

function requestCode() {
    submitting.value = true
    errorMessage.value = ''
    infoMessage.value = ''
    demoCode.value = ''
    iamStore.requestRecovery(email.value)
        .then(result => {
            step.value = 2
            if (result.emailSent) {
                infoMessage.value = t('recover.sentEmail', { email: email.value })
            } else {
                demoCode.value = result.code
                infoMessage.value = t('recover.sentDemo')
            }
        })
        .catch(e => {
            errorMessage.value = t(`recover.error.${e.message}`, t('recover.error.generic'))
        })
        .finally(() => { submitting.value = false })
}

function resetPassword() {
    errorMessage.value = ''
    if (newPassword.value !== confirmPassword.value) {
        errorMessage.value = t('recover.error.mismatch')
        return
    }
    submitting.value = true
    iamStore.resetPassword(email.value, code.value, newPassword.value)
        .then(() => router.push({ name: 'login', query: { recovered: '1' } }))
        .catch(e => {
            errorMessage.value = t(`recover.error.${e.message}`, t('recover.error.generic'))
        })
        .finally(() => { submitting.value = false })
}
</script>

<template>
    <div class="login">
        <div class="login__panel vc-card">
            <LocaleToggle class="login__locale" />
            <BrandLogo :size="34" class="login__brand" />
            <h1 class="login__title">{{ t('recover.title') }}</h1>
            <p class="login__subtitle">
                {{ step === 1 ? t('recover.subtitleEmail') : t('recover.subtitleCode') }}
            </p>

            <form v-if="step === 1" class="login__form" @submit.prevent="requestCode">
                <label class="field">
                    <span class="field__label">{{ t('login.email') }}</span>
                    <span class="field__control">
                        <i class="pi pi-envelope field__icon" />
                        <input v-model="email" type="email" class="field__input" :placeholder="t('login.emailPlaceholder')" required />
                    </span>
                </label>
                <p v-if="errorMessage" class="login__error"><i class="pi pi-exclamation-triangle" /> {{ errorMessage }}</p>
                <button class="login__submit" type="submit" :disabled="submitting">
                    <i v-if="submitting" class="pi pi-spin pi-spinner" />
                    <span>{{ t('recover.sendCode') }}</span>
                </button>
            </form>

            <form v-else class="login__form" @submit.prevent="resetPassword">
                <p v-if="infoMessage" class="login__info"><i class="pi pi-info-circle" /> {{ infoMessage }}</p>
                <p v-if="demoCode" class="login__code">{{ t('recover.yourCode') }}: <strong>{{ demoCode }}</strong></p>
                <label class="field">
                    <span class="field__label">{{ t('recover.code') }}</span>
                    <span class="field__control">
                        <i class="pi pi-key field__icon" />
                        <input v-model="code" type="text" inputmode="numeric" class="field__input" :placeholder="t('recover.codePlaceholder')" required />
                    </span>
                </label>
                <label class="field">
                    <span class="field__label">{{ t('recover.newPassword') }}</span>
                    <span class="field__control">
                        <i class="pi pi-lock field__icon" />
                        <input v-model="newPassword" type="password" class="field__input" :placeholder="t('recover.newPasswordPlaceholder')" required />
                    </span>
                </label>
                <label class="field">
                    <span class="field__label">{{ t('recover.confirmPassword') }}</span>
                    <span class="field__control">
                        <i class="pi pi-lock field__icon" />
                        <input v-model="confirmPassword" type="password" class="field__input" :placeholder="t('recover.confirmPassword')" required />
                    </span>
                </label>
                <p v-if="errorMessage" class="login__error"><i class="pi pi-exclamation-triangle" /> {{ errorMessage }}</p>
                <button class="login__submit" type="submit" :disabled="submitting">
                    <i v-if="submitting" class="pi pi-spin pi-spinner" />
                    <span>{{ t('recover.reset') }}</span>
                </button>
            </form>

            <RouterLink class="login__link" :to="{ name: 'login' }">{{ t('recover.backToLogin') }}</RouterLink>
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
.login__panel { position: relative; width: 100%; max-width: 400px; padding: 2.25rem 2rem; display: flex; flex-direction: column; }
.login__locale { position: absolute; top: 1rem; right: 1rem; }
.login__brand { color: var(--vc-brand-500); margin-bottom: 1.25rem; }
.login__title { font-size: 1.4rem; font-weight: 700; margin: 0; color: var(--vc-text); }
.login__subtitle { color: var(--vc-text-muted); margin: 0.25rem 0 1.5rem; }
.login__form { display: flex; flex-direction: column; gap: 1rem; }
.field { display: flex; flex-direction: column; gap: 0.35rem; }
.field__label { font-size: 0.85rem; font-weight: 600; color: var(--vc-text); }
.field__control {
    display: flex; align-items: center;
    border: 1px solid var(--vc-border); border-radius: 10px;
    background: var(--vc-surface-2); padding: 0 0.75rem;
    transition: border-color 0.15s ease;
}
.field__control:focus-within { border-color: var(--vc-brand-500); }
.field__icon { color: var(--vc-text-muted); font-size: 0.95rem; }
.field__input { flex: 1; border: none; background: transparent; padding: 0.7rem 0.6rem; font: inherit; color: var(--vc-text); outline: none; }
.login__submit {
    margin-top: 0.5rem; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
    padding: 0.8rem 1rem; border: none; border-radius: 10px;
    background: var(--vc-brand-500); color: #fff; font: inherit; font-weight: 600; cursor: pointer;
    transition: background 0.15s ease;
}
.login__submit:hover:not(:disabled) { background: var(--vc-brand-600); }
.login__submit:disabled { opacity: 0.7; cursor: default; }
.login__error { display: flex; align-items: center; gap: 0.5rem; margin: 0; color: var(--vc-danger-500); font-size: 0.85rem; }
.login__info { display: flex; align-items: center; gap: 0.5rem; margin: 0; color: var(--vc-text-muted); font-size: 0.85rem; }
.login__code {
    margin: 0; padding: 0.6rem 0.8rem; border-radius: 10px;
    background: rgba(22, 163, 74, 0.12); color: var(--vc-brand-700, var(--vc-text));
    font-size: 0.95rem; text-align: center; letter-spacing: 0.06em;
}
.login__link { display: block; text-align: center; margin-top: 1.25rem; color: var(--vc-brand-500); font-size: 0.85rem; font-weight: 600; }
</style>

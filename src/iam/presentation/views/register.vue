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

const businessName = ref('')
const ruc = ref('')
const category = ref('')
const ownerName = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const done = ref(false)
const emailSent = ref(false)
const verificationLink = ref('')

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

const fieldErrors = ref({})
const submitted = ref(false)

function checkField(field) {
    switch (field) {
        case 'businessName':
            return businessName.value.trim() ? '' : 'businessNameRequired'
        case 'ownerName':
            return ownerName.value.trim() ? '' : 'ownerNameRequired'
        case 'email':
            if (!email.value.trim()) return 'emailRequired'
            return EMAIL_PATTERN.test(email.value.trim()) ? '' : 'emailInvalid'
        case 'phone':
            return phone.value.trim() ? '' : 'phoneRequired'
        case 'password':
            if (!password.value) return 'passwordRequired'
            return password.value.length < MIN_PASSWORD_LENGTH ? 'passwordShort' : ''
        case 'confirmPassword':
            if (!confirmPassword.value) return 'confirmRequired'
            return password.value === confirmPassword.value ? '' : 'mismatch'
        default:
            return ''
    }
}

const FIELDS = ['businessName', 'ownerName', 'email', 'phone', 'password', 'confirmPassword']

function validate() {
    const errors = {}
    FIELDS.forEach(field => {
        const key = checkField(field)
        if (key) errors[field] = key
    })
    fieldErrors.value = errors
    return Object.keys(errors).length === 0
}

function revalidate(field) {
    if (!submitted.value) return
    const key = checkField(field)
    const next = { ...fieldErrors.value }
    if (key) next[field] = key
    else delete next[field]
    if (field === 'password') {
        const confirmKey = checkField('confirmPassword')
        if (confirmKey) next.confirmPassword = confirmKey
        else delete next.confirmPassword
    }
    fieldErrors.value = next
}

function submit() {
    errorMessage.value = ''
    submitted.value = true
    if (!validate()) return
    submitting.value = true
    iamStore.registerAccount({
        businessName: businessName.value,
        ruc: ruc.value,
        category: category.value,
        ownerName: ownerName.value,
        email: email.value,
        phone: phone.value,
        password: password.value
    })
        .then(result => {
            emailSent.value = result.emailSent
            verificationLink.value = result.link || ''
            done.value = true
        })
        .catch(e => {
            errorMessage.value = t(`register.error.${e.message}`, t('register.error.generic'))
        })
        .finally(() => {
            submitting.value = false
        })
}

</script>

<template>
    <div class="login">
        <div class="login__panel vc-card">
            <LocaleToggle class="login__locale" />
            <BrandLogo :size="34" class="login__brand" />

            <template v-if="done">
                <div class="login__done-icon"><i class="pi pi-envelope" /></div>
                <h1 class="login__title">{{ t('register.doneTitle') }}</h1>
                <p class="login__subtitle" v-if="emailSent">{{ t('register.doneEmail', { email }) }}</p>
                <p class="login__subtitle" v-else>{{ t('register.doneDemo') }}</p>

                <a v-if="!emailSent" class="login__submit" :href="verificationLink">
                    {{ t('register.openLink') }}
                </a>

                <RouterLink class="login__link login__done-back" :to="{ name: 'login' }">
                    {{ t('register.goToLogin') }}
                </RouterLink>
            </template>

            <template v-else>
            <h1 class="login__title">{{ t('register.title') }}</h1>
            <p class="login__subtitle">{{ t('register.subtitle') }}</p>

            <form class="login__form" novalidate @submit.prevent="submit">
                <label class="field">
                    <span class="field__label">{{ t('register.businessName') }}</span>
                    <span class="field__control" :class="{ 'field__control--error': fieldErrors.businessName }">
                        <i class="pi pi-shop field__icon" />
                        <input v-model="businessName" type="text" class="field__input" :placeholder="t('register.businessNamePlaceholder')" @input="revalidate('businessName')" />
                    </span>
                    <span v-if="fieldErrors.businessName" class="field__error">{{ t(`register.error.${fieldErrors.businessName}`) }}</span>
                </label>

                <div class="login__row">
                    <label class="field">
                        <span class="field__label">{{ t('register.ruc') }}</span>
                        <span class="field__control">
                            <i class="pi pi-id-card field__icon" />
                            <input v-model="ruc" type="text" class="field__input" :placeholder="t('register.rucPlaceholder')" />
                        </span>
                    </label>
                    <label class="field">
                        <span class="field__label">{{ t('register.category') }}</span>
                        <span class="field__control">
                            <i class="pi pi-tag field__icon" />
                            <input v-model="category" type="text" class="field__input" :placeholder="t('register.categoryPlaceholder')" />
                        </span>
                    </label>
                </div>

                <label class="field">
                    <span class="field__label">{{ t('register.ownerName') }}</span>
                    <span class="field__control" :class="{ 'field__control--error': fieldErrors.ownerName }">
                        <i class="pi pi-user field__icon" />
                        <input v-model="ownerName" type="text" class="field__input" :placeholder="t('register.ownerNamePlaceholder')" @input="revalidate('ownerName')" />
                    </span>
                    <span v-if="fieldErrors.ownerName" class="field__error">{{ t(`register.error.${fieldErrors.ownerName}`) }}</span>
                </label>

                <label class="field">
                    <span class="field__label">{{ t('login.email') }}</span>
                    <span class="field__control" :class="{ 'field__control--error': fieldErrors.email }">
                        <i class="pi pi-envelope field__icon" />
                        <input v-model="email" type="email" class="field__input" :placeholder="t('login.emailPlaceholder')" autocomplete="username" @input="revalidate('email')" />
                    </span>
                    <span v-if="fieldErrors.email" class="field__error">{{ t(`register.error.${fieldErrors.email}`) }}</span>
                </label>

                <label class="field">
                    <span class="field__label">{{ t('register.phone') }}</span>
                    <span class="field__control" :class="{ 'field__control--error': fieldErrors.phone }">
                        <i class="pi pi-phone field__icon" />
                        <input v-model="phone" type="tel" class="field__input" :placeholder="t('register.phonePlaceholder')" autocomplete="tel" @input="revalidate('phone')" />
                    </span>
                    <span v-if="fieldErrors.phone" class="field__error">{{ t(`register.error.${fieldErrors.phone}`) }}</span>
                </label>

                <label class="field">
                    <span class="field__label">{{ t('login.password') }}</span>
                    <span class="field__control" :class="{ 'field__control--error': fieldErrors.password }">
                        <i class="pi pi-lock field__icon" />
                        <input
                            v-model="password"
                            :type="showPassword ? 'text' : 'password'"
                            class="field__input"
                            :placeholder="t('login.passwordPlaceholder')"
                            autocomplete="new-password"
                            @input="revalidate('password')"
                        />
                        <button
                            type="button"
                            class="field__toggle"
                            :aria-label="t('login.togglePassword')"
                            @click="showPassword = !showPassword"
                        >
                            <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" />
                        </button>
                    </span>
                    <span v-if="fieldErrors.password" class="field__error">{{ t(`register.error.${fieldErrors.password}`) }}</span>
                </label>

                <label class="field">
                    <span class="field__label">{{ t('register.confirmPassword') }}</span>
                    <span class="field__control" :class="{ 'field__control--error': fieldErrors.confirmPassword }">
                        <i class="pi pi-lock field__icon" />
                        <input
                            v-model="confirmPassword"
                            :type="showPassword ? 'text' : 'password'"
                            class="field__input"
                            :placeholder="t('register.confirmPasswordPlaceholder')"
                            autocomplete="new-password"
                            @input="revalidate('confirmPassword')"
                        />
                    </span>
                    <span v-if="fieldErrors.confirmPassword" class="field__error">{{ t(`register.error.${fieldErrors.confirmPassword}`) }}</span>
                </label>

                <p v-if="errorMessage" class="login__error">
                    <i class="pi pi-exclamation-triangle" /> {{ errorMessage }}
                </p>

                <button class="login__submit" type="submit" :disabled="submitting">
                    <i v-if="submitting" class="pi pi-spin pi-spinner" />
                    <span>{{ t('register.submit') }}</span>
                </button>
            </form>

            <p class="login__hint">
                {{ t('register.haveAccount') }}
                <RouterLink class="login__link" :to="{ name: 'login' }">{{ t('register.signIn') }}</RouterLink>
            </p>
            </template>
        </div>
    </div>
</template>

<style scoped>
.login {
    min-height: 100vh;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 2.5rem 1.5rem;
    box-sizing: border-box;
    background:
        radial-gradient(1200px 600px at 100% -10%, rgba(22, 163, 74, 0.14), transparent 60%),
        var(--vc-bg);
}
.login__panel {
    position: relative;
    width: 100%;
    max-width: 440px;
    margin: auto;
    padding: 2.25rem 2rem;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
}
.login__locale { position: absolute; top: 1rem; right: 1rem; }
.login__brand { color: var(--vc-brand-500); margin-bottom: 1.25rem; }
.login__title { font-size: 1.4rem; font-weight: 700; margin: 0; color: var(--vc-text); }
.login__subtitle { color: var(--vc-text-muted); margin: 0.25rem 0 1.5rem; }

.login__form { display: flex; flex-direction: column; gap: 1rem; }
.login__row { display: flex; gap: 1rem; }
.login__row .field { flex: 1; min-width: 0; }
.field { display: flex; flex-direction: column; gap: 0.35rem; }
.field__label { font-size: 0.85rem; font-weight: 600; color: var(--vc-text); }
.field__control {
    display: flex;
    align-items: center;
    border: 1px solid var(--vc-border);
    border-radius: 10px;
    background: var(--vc-surface-2);
    padding: 0 0.75rem;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.field__control:focus-within {
    border-color: var(--vc-brand-500);
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15);
}
.field__control--error {
    border-color: var(--vc-danger-500);
}
.field__control--error:focus-within {
    border-color: var(--vc-danger-500);
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15);
}
.field__error {
    font-size: 0.78rem;
    color: var(--vc-danger-500);
}
.field__icon { color: var(--vc-text-muted); font-size: 0.95rem; }
.field__input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 0.7rem 0.6rem;
    font: inherit;
    color: var(--vc-text);
    outline: none;
    min-width: 0;
}
.field__toggle {
    border: none; background: transparent; cursor: pointer;
    color: var(--vc-text-muted); padding: 0.25rem;
}
.login__submit {
    margin-top: 0.5rem;
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
    transition: background 0.15s ease;
}
.login__submit:hover:not(:disabled) { background: var(--vc-brand-600); }
.login__submit:disabled { opacity: 0.7; cursor: default; }
.login__error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    color: var(--vc-danger-500);
    font-size: 0.85rem;
}
.login__hint { text-align: center; color: var(--vc-text-muted); font-size: 0.85rem; margin: 1.25rem 0 0; }
.login__link { color: var(--vc-brand-500); font-weight: 600; }
.login__submit { text-decoration: none; }
.login__done-icon {
    align-self: center;
    display: grid; place-items: center;
    width: 56px; height: 56px; margin-bottom: 1rem;
    border-radius: 50%;
    background: rgba(22, 163, 74, 0.12); color: var(--vc-brand-600, var(--vc-brand-500));
    font-size: 1.5rem;
}
.login__done-back { text-align: center; margin-top: 1rem; }
</style>

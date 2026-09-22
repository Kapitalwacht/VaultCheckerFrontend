<script setup>

import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import useIamStore from '@/iam/application/iam.store.js'
import { useCurrencyFormatter, setCurrency } from '@/shared/infrastructure/currency-formatter.js'

const { t } = useI18n()
const iamStore = useIamStore()
const { currentUser } = storeToRefs(iamStore)
const { currency } = useCurrencyFormatter()

const profileForm = reactive({ name: '', phone: '' })
const emailForm = reactive({ next: '' })
const passwordForm = reactive({ current: '', next: '', confirm: '' })
const showPasswords = ref(false)

const savingProfile = ref(false)
const savingEmail = ref(false)
const savingPassword = ref(false)
const profileMessage = ref('')
const profileError = ref('')
const emailMessage = ref('')
const emailError = ref('')
const emailVerificationLink = ref('')
const passwordMessage = ref('')
const passwordError = ref('')

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8
const emailErrors = ref({})
const emailSubmitted = ref(false)
const passwordErrors = ref({})
const passwordSubmitted = ref(false)

function checkEmailField() {
    const next = emailForm.next.trim()
    if (!next) return 'emailRequired'
    if (!EMAIL_PATTERN.test(next)) return 'emailInvalid'
    if (next.toLowerCase() === (currentUser.value?.email ?? '').toLowerCase()) return 'same-email'
    return ''
}

function revalidateEmail() {
    if (!emailSubmitted.value) return
    const key = checkEmailField()
    emailErrors.value = key ? { next: key } : {}
}

function checkPasswordField(field) {
    switch (field) {
        case 'current':
            return passwordForm.current ? '' : 'currentPasswordRequired'
        case 'next':
            if (!passwordForm.next) return 'passwordRequired'
            return passwordForm.next.length < MIN_PASSWORD_LENGTH ? 'passwordShort' : ''
        case 'confirm':
            if (!passwordForm.confirm) return 'confirmRequired'
            return passwordForm.next === passwordForm.confirm ? '' : 'mismatch'
        default:
            return ''
    }
}

function validatePassword() {
    const errors = {}
    ;['current', 'next', 'confirm'].forEach(field => {
        const key = checkPasswordField(field)
        if (key) errors[field] = key
    })
    passwordErrors.value = errors
    return Object.keys(errors).length === 0
}

function revalidatePassword(field) {
    if (!passwordSubmitted.value) return
    const key = checkPasswordField(field)
    const nextErrors = { ...passwordErrors.value }
    if (key) nextErrors[field] = key
    else delete nextErrors[field]
    if (field === 'next') {
        const confirmKey = checkPasswordField('confirm')
        if (confirmKey) nextErrors.confirm = confirmKey
        else delete nextErrors.confirm
    }
    passwordErrors.value = nextErrors
}

function loadProfile() {
    profileForm.name = currentUser.value?.name ?? ''
    profileForm.phone = currentUser.value?.phone ?? ''
}

async function saveProfile() {
    savingProfile.value = true
    profileMessage.value = ''
    profileError.value = ''
    try {
        await iamStore.updateProfile({ name: profileForm.name, phone: profileForm.phone })
        profileMessage.value = t('profile.savedProfile')
    } catch (e) {
        profileError.value = t(`profile.error.${e.message}`, t('profile.error.generic'))
    } finally {
        savingProfile.value = false
    }
}

async function changeEmail() {
    emailSubmitted.value = true
    emailMessage.value = ''
    emailError.value = ''
    emailVerificationLink.value = ''
    const validationKey = checkEmailField()
    if (validationKey) {
        emailErrors.value = { next: validationKey }
        return
    }
    emailErrors.value = {}
    const next = emailForm.next.trim()
    savingEmail.value = true
    try {
        const result = await iamStore.changeEmail(next)
        emailForm.next = ''
        emailSubmitted.value = false
        emailVerificationLink.value = result.emailSent ? '' : result.link
        emailMessage.value = result.emailSent
            ? t('profile.emailSent', { email: next })
            : t('profile.emailDemo')
    } catch (e) {
        emailError.value = t(`profile.error.${e.message}`, t('profile.error.generic'))
    } finally {
        savingEmail.value = false
    }
}

async function savePassword() {
    passwordSubmitted.value = true
    passwordMessage.value = ''
    passwordError.value = ''
    if (!validatePassword()) return
    savingPassword.value = true
    try {
        await iamStore.changePassword(passwordForm.current, passwordForm.next)
        passwordForm.current = ''
        passwordForm.next = ''
        passwordForm.confirm = ''
        passwordSubmitted.value = false
        passwordErrors.value = {}
        passwordMessage.value = t('profile.savedPassword')
    } catch (e) {
        passwordError.value = t(`profile.error.${e.message}`, t('profile.error.generic'))
    } finally {
        savingPassword.value = false
    }
}

onMounted(loadProfile)

</script>

<template>
    <div class="vc-page">
        <div class="vc-page__head">
            <div class="vc-page__head-text">
                <h1 class="vc-page__title">{{ t('profile.title') }}</h1>
                <p class="vc-page__subtitle">{{ t('profile.subtitle') }}</p>
            </div>
        </div>

        <div class="profile-grid">
            <section class="vc-card profile-card">
                <h2 class="profile-card__title">{{ t('profile.preferences') }}</h2>
                <p class="profile-card__role">{{ t('profile.preferencesHint') }}</p>
                <label class="vc-field vc-field--full">
                    <span class="vc-field__label">{{ t('profile.currency') }}</span>
                    <select :value="currency" class="vc-input" @change="setCurrency($event.target.value)">
                        <option value="PEN">{{ t('profile.currencyPen') }}</option>
                        <option value="USD">{{ t('profile.currencyUsd') }}</option>
                    </select>
                </label>
            </section>

            <section class="vc-card profile-card">
                <h2 class="profile-card__title">{{ t('profile.basic') }}</h2>
                <p class="profile-card__role">
                    {{ t(`roles.${currentUser?.role}`, currentUser?.role) }}
                    <template v-if="currentUser?.storeId"> · {{ currentUser.storeId }}</template>
                </p>
                <form class="vc-form-grid" @submit.prevent="saveProfile">
                    <label class="vc-field vc-field--full">
                        <span class="vc-field__label">{{ t('profile.name') }}</span>
                        <input v-model="profileForm.name" class="vc-input" required />
                    </label>
                    <label class="vc-field vc-field--full">
                        <span class="vc-field__label">{{ t('profile.phone') }}</span>
                        <input v-model="profileForm.phone" class="vc-input" type="tel" :placeholder="t('register.phonePlaceholder')" />
                    </label>
                    <p v-if="profileError" class="profile-msg profile-msg--error"><i class="pi pi-exclamation-triangle" /> {{ profileError }}</p>
                    <p v-if="profileMessage" class="profile-msg profile-msg--ok"><i class="pi pi-check-circle" /> {{ profileMessage }}</p>
                    <div class="profile-actions">
                        <button class="vc-btn vc-btn--primary" type="submit" :disabled="savingProfile">
                            <i v-if="savingProfile" class="pi pi-spinner vc-spin" /> {{ t('common.save') }}
                        </button>
                    </div>
                </form>
            </section>

            <section class="vc-card profile-card">
                <h2 class="profile-card__title">{{ t('profile.emailTitle') }}</h2>
                <p class="profile-card__role">{{ t('profile.emailHint') }}</p>
                <form class="vc-form-grid" novalidate @submit.prevent="changeEmail">
                    <label class="vc-field vc-field--full">
                        <span class="vc-field__label">{{ t('profile.currentEmail') }}</span>
                        <input :value="currentUser?.email" class="vc-input" type="email" disabled />
                    </label>
                    <label class="vc-field vc-field--full">
                        <span class="vc-field__label">{{ t('profile.newEmail') }}</span>
                        <input v-model="emailForm.next" class="vc-input" :class="{ 'vc-input--error': emailErrors.next }" type="email" :placeholder="t('profile.newEmailPlaceholder')" @input="revalidateEmail" />
                        <span v-if="emailErrors.next" class="vc-field__error">{{ t(`profile.error.${emailErrors.next}`) }}</span>
                    </label>
                    <p v-if="emailError" class="profile-msg profile-msg--error"><i class="pi pi-exclamation-triangle" /> {{ emailError }}</p>
                    <p v-if="emailMessage" class="profile-msg profile-msg--ok"><i class="pi pi-check-circle" /> {{ emailMessage }}</p>
                    <a v-if="emailVerificationLink" class="profile-msg profile-verify" :href="emailVerificationLink">
                        <i class="pi pi-link" /> {{ t('profile.verifyNow') }}
                    </a>
                    <div class="profile-actions">
                        <button class="vc-btn vc-btn--primary" type="submit" :disabled="savingEmail">
                            <i v-if="savingEmail" class="pi pi-spinner vc-spin" /> {{ t('profile.changeEmail') }}
                        </button>
                    </div>
                </form>
            </section>

            <section class="vc-card profile-card">
                <h2 class="profile-card__title">{{ t('profile.password') }}</h2>
                <p class="profile-card__role">{{ t('profile.passwordHint') }}</p>
                <form class="vc-form-grid" novalidate @submit.prevent="savePassword">
                    <label class="vc-field vc-field--full">
                        <span class="vc-field__label">{{ t('profile.currentPassword') }}</span>
                        <span class="vc-password">
                            <input v-model="passwordForm.current" :type="showPasswords ? 'text' : 'password'" class="vc-input vc-password__input" :class="{ 'vc-input--error': passwordErrors.current }" @input="revalidatePassword('current')" />
                            <button type="button" class="vc-password__toggle" :aria-label="t('login.togglePassword')" @click="showPasswords = !showPasswords">
                                <i :class="showPasswords ? 'pi pi-eye-slash' : 'pi pi-eye'" />
                            </button>
                        </span>
                        <span v-if="passwordErrors.current" class="vc-field__error">{{ t(`profile.error.${passwordErrors.current}`) }}</span>
                    </label>
                    <label class="vc-field vc-field--full">
                        <span class="vc-field__label">{{ t('profile.newPassword') }}</span>
                        <span class="vc-password">
                            <input v-model="passwordForm.next" :type="showPasswords ? 'text' : 'password'" class="vc-input vc-password__input" :class="{ 'vc-input--error': passwordErrors.next }" @input="revalidatePassword('next')" />
                            <button type="button" class="vc-password__toggle" :aria-label="t('login.togglePassword')" @click="showPasswords = !showPasswords">
                                <i :class="showPasswords ? 'pi pi-eye-slash' : 'pi pi-eye'" />
                            </button>
                        </span>
                        <span v-if="passwordErrors.next" class="vc-field__error">{{ t(`profile.error.${passwordErrors.next}`) }}</span>
                    </label>
                    <label class="vc-field vc-field--full">
                        <span class="vc-field__label">{{ t('profile.confirmPassword') }}</span>
                        <span class="vc-password">
                            <input v-model="passwordForm.confirm" :type="showPasswords ? 'text' : 'password'" class="vc-input vc-password__input" :class="{ 'vc-input--error': passwordErrors.confirm }" @input="revalidatePassword('confirm')" />
                            <button type="button" class="vc-password__toggle" :aria-label="t('login.togglePassword')" @click="showPasswords = !showPasswords">
                                <i :class="showPasswords ? 'pi pi-eye-slash' : 'pi pi-eye'" />
                            </button>
                        </span>
                        <span v-if="passwordErrors.confirm" class="vc-field__error">{{ t(`profile.error.${passwordErrors.confirm}`) }}</span>
                    </label>
                    <p v-if="passwordError" class="profile-msg profile-msg--error"><i class="pi pi-exclamation-triangle" /> {{ passwordError }}</p>
                    <p v-if="passwordMessage" class="profile-msg profile-msg--ok"><i class="pi pi-check-circle" /> {{ passwordMessage }}</p>
                    <div class="profile-actions">
                        <button class="vc-btn vc-btn--primary" type="submit" :disabled="savingPassword">
                            <i v-if="savingPassword" class="pi pi-spinner vc-spin" /> {{ t('profile.changePassword') }}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    </div>
</template>

<style scoped>
.profile-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.25rem;
}
.profile-card { padding: 1.5rem; }
.profile-card__title { margin: 0 0 0.25rem; font-size: 1.05rem; }
.profile-card__role { margin: 0 0 1.25rem; font-size: 0.85rem; color: var(--vc-text-muted); text-transform: capitalize; }
.vc-input--error { border-color: var(--vc-danger-500); }
.vc-input--error:focus { border-color: var(--vc-danger-500); box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15); }
.vc-field__error { margin-top: 0.3rem; font-size: 0.78rem; color: var(--vc-danger-500); }
.profile-msg { grid-column: 1 / -1; margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; }
.profile-msg--error { color: var(--vc-danger-500); }
.profile-msg--ok { color: var(--vc-brand-600, var(--vc-success-500)); }
.profile-verify { color: var(--vc-brand-500); font-weight: 600; font-size: 0.85rem; text-decoration: none; word-break: break-all; }
.profile-actions { grid-column: 1 / -1; display: flex; justify-content: center; }
.profile-actions .vc-btn { min-width: 180px; justify-content: center; }
.vc-password { position: relative; display: block; }
.vc-password__input { width: 100%; padding-right: 2.5rem; box-sizing: border-box; }
.vc-password__toggle {
    position: absolute; top: 50%; right: 0.5rem; transform: translateY(-50%);
    border: none; background: transparent; cursor: pointer;
    color: var(--vc-text-muted); padding: 0.25rem; display: flex; align-items: center;
}
</style>

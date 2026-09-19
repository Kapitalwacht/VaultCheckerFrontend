<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import useIamStore from '@/iam/application/iam.store.js'

const { t } = useI18n()
const iamStore = useIamStore()
const { currentUser } = storeToRefs(iamStore)

const profileForm = reactive({ name: '', email: '' })
const passwordForm = reactive({ current: '', next: '', confirm: '' })

const savingProfile = ref(false)
const savingPassword = ref(false)
const profileMessage = ref('')
const profileError = ref('')
const passwordMessage = ref('')
const passwordError = ref('')

function loadProfile() {
    profileForm.name = currentUser.value?.name ?? ''
    profileForm.email = currentUser.value?.email ?? ''
}

async function saveProfile() {
    savingProfile.value = true
    profileMessage.value = ''
    profileError.value = ''
    try {
        await iamStore.updateProfile({ name: profileForm.name, email: profileForm.email })
        profileMessage.value = t('profile.savedProfile')
    } catch (e) {
        profileError.value = t(`profile.error.${e.message}`, t('profile.error.generic'))
    } finally {
        savingProfile.value = false
    }
}

async function savePassword() {
    passwordMessage.value = ''
    passwordError.value = ''
    if (passwordForm.next !== passwordForm.confirm) {
        passwordError.value = t('profile.error.mismatch')
        return
    }
    savingPassword.value = true
    try {
        await iamStore.changePassword(passwordForm.current, passwordForm.next)
        passwordForm.current = ''
        passwordForm.next = ''
        passwordForm.confirm = ''
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
                        <span class="vc-field__label">{{ t('profile.email') }}</span>
                        <input v-model="profileForm.email" type="email" class="vc-input" required />
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
                <h2 class="profile-card__title">{{ t('profile.password') }}</h2>
                <p class="profile-card__role">{{ t('profile.passwordHint') }}</p>
                <form class="vc-form-grid" @submit.prevent="savePassword">
                    <label class="vc-field vc-field--full">
                        <span class="vc-field__label">{{ t('profile.currentPassword') }}</span>
                        <input v-model="passwordForm.current" type="password" class="vc-input" required />
                    </label>
                    <label class="vc-field vc-field--full">
                        <span class="vc-field__label">{{ t('profile.newPassword') }}</span>
                        <input v-model="passwordForm.next" type="password" class="vc-input" required />
                    </label>
                    <label class="vc-field vc-field--full">
                        <span class="vc-field__label">{{ t('profile.confirmPassword') }}</span>
                        <input v-model="passwordForm.confirm" type="password" class="vc-input" required />
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
.profile-msg { grid-column: 1 / -1; margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; }
.profile-msg--error { color: var(--vc-danger-500); }
.profile-msg--ok { color: var(--vc-brand-600, var(--vc-success-500)); }
.profile-actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; }
</style>

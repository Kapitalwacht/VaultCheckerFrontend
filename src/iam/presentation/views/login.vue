<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import BrandLogo from '@/shared/presentation/components/brand-logo.vue'
import useIamStore from '@/iam/application/iam.store.js'
import { signInWithGoogle as googleSignIn, isGoogleConfigured } from '@/iam/infrastructure/google-identity.js'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const iamStore = useIamStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const recovered = ref(route.query.recovered === '1')
const googleMessage = ref('')
const googleLoading = ref(false)

function redirectAfterLogin(user) {
    const fallback = user.isCustomer ? '/credit/report' : '/home'
    router.push(route.query.redirect || fallback)
}

function submit() {
    submitting.value = true
    errorMessage.value = ''
    iamStore.signIn({ email: email.value, password: password.value })
        .then(redirectAfterLogin)
        .catch(e => {
            errorMessage.value = t(`login.error.${e.message}`, t('login.error.generic'))
        })
        .finally(() => {
            submitting.value = false
        })
}

async function handleGoogle() {
    errorMessage.value = ''
    googleMessage.value = ''
    if (!isGoogleConfigured()) {
        googleMessage.value = t('login.googleNote')
        return
    }
    googleLoading.value = true
    try {
        const profile = await googleSignIn()
        const user = await iamStore.signInWithGoogle(profile)
        redirectAfterLogin(user)
    } catch (e) {
        errorMessage.value = t(`login.error.${e.message}`, t('login.error.generic'))
    } finally {
        googleLoading.value = false
    }
}
</script>

<template>
    <div class="login">
        <div class="login__panel vc-card">
            <BrandLogo :size="34" class="login__brand" />
            <h1 class="login__title">{{ t('login.title') }}</h1>
            <p class="login__subtitle">{{ t('login.subtitle') }}</p>

            <p v-if="recovered" class="login__success">
                <i class="pi pi-check-circle" /> {{ t('login.recoveredOk') }}
            </p>

            <form class="login__form" @submit.prevent="submit">
                <label class="field">
                    <span class="field__label">{{ t('login.email') }}</span>
                    <span class="field__control">
                        <i class="pi pi-envelope field__icon" />
                        <input
                            v-model="email"
                            type="email"
                            class="field__input"
                            :placeholder="t('login.emailPlaceholder')"
                            autocomplete="username"
                            required
                        />
                    </span>
                </label>

                <label class="field">
                    <span class="field__label">{{ t('login.password') }}</span>
                    <span class="field__control">
                        <i class="pi pi-lock field__icon" />
                        <input
                            v-model="password"
                            :type="showPassword ? 'text' : 'password'"
                            class="field__input"
                            :placeholder="t('login.passwordPlaceholder')"
                            autocomplete="current-password"
                            required
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
                </label>

                <RouterLink class="login__forgot" :to="{ name: 'recover' }">{{ t('login.forgot') }}</RouterLink>

                <p v-if="errorMessage" class="login__error">
                    <i class="pi pi-exclamation-triangle" /> {{ errorMessage }}
                </p>

                <button class="login__submit" type="submit" :disabled="submitting">
                    <i v-if="submitting" class="pi pi-spin pi-spinner" />
                    <span>{{ t('login.submit') }}</span>
                </button>
            </form>

            <div class="login__divider"><span>{{ t('login.or') }}</span></div>

            <button type="button" class="login__google-btn" :disabled="googleLoading" @click="handleGoogle">
                <svg class="login__google-icon" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
                    <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"/>
                    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
                </svg>
                <span>{{ t('login.google') }}</span>
            </button>
            <p v-if="googleMessage" class="login__google-note">{{ googleMessage }}</p>

            <p class="login__hint">{{ t('login.hint') }}</p>
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
    width: 100%;
    max-width: 400px;
    padding: 2.25rem 2rem;
    display: flex;
    flex-direction: column;
}
.login__brand { color: var(--vc-brand-500); margin-bottom: 1.25rem; }
.login__title { font-size: 1.4rem; font-weight: 700; margin: 0; color: var(--vc-text); }
.login__subtitle { color: var(--vc-text-muted); margin: 0.25rem 0 1.5rem; }

.login__form { display: flex; flex-direction: column; gap: 1rem; }
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
.field__icon { color: var(--vc-text-muted); font-size: 0.95rem; }
.field__input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 0.7rem 0.6rem;
    font: inherit;
    color: var(--vc-text);
    outline: none;
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
.login__hint { text-align: center; color: var(--vc-text-muted); font-size: 0.8rem; margin: 1.25rem 0 0; }
.login__success {
    display: flex; align-items: center; gap: 0.5rem;
    margin: 0 0 1rem; padding: 0.6rem 0.8rem; border-radius: 10px;
    background: rgba(22, 163, 74, 0.12); color: var(--vc-brand-700, var(--vc-text)); font-size: 0.85rem;
}
.login__forgot { align-self: flex-end; margin-top: -0.5rem; color: var(--vc-brand-500); font-size: 0.82rem; font-weight: 600; }
.login__divider {
    display: flex; align-items: center; gap: 0.75rem;
    margin: 1.25rem 0 1rem; color: var(--vc-text-muted); font-size: 0.8rem;
}
.login__divider::before, .login__divider::after {
    content: ''; flex: 1; height: 1px; background: var(--vc-border);
}
.login__google-btn {
    display: flex; align-items: center; justify-content: center; gap: 0.6rem;
    width: 100%; padding: 0.7rem 1rem;
    border: 1px solid var(--vc-border); border-radius: 10px;
    background: var(--vc-surface); color: var(--vc-text);
    font: inherit; font-weight: 600; font-size: 0.92rem; cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
}
.login__google-btn:hover:not(:disabled) { background: var(--vc-surface-2); border-color: var(--vc-text-muted); }
.login__google-btn:disabled { opacity: 0.7; cursor: default; }
.login__google-icon { width: 18px; height: 18px; flex: none; }
.login__google-note { text-align: center; color: var(--vc-text-muted); font-size: 0.78rem; margin: 0.6rem 0 0; }
</style>

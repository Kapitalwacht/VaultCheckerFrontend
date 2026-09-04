<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import BrandLogo from '@/shared/presentation/components/brand-logo.vue'

const { t } = useI18n()
const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const submitting = ref(false)

function submit() {
    submitting.value = true
    setTimeout(() => {
        submitting.value = false
        router.push('/home')
    }, 300)
}
</script>

<template>
    <div class="login">
        <div class="login__panel vc-card">
            <BrandLogo :size="34" class="login__brand" />
            <h1 class="login__title">{{ t('login.title') }}</h1>
            <p class="login__subtitle">{{ t('login.subtitle') }}</p>

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

                <button class="login__submit" type="submit" :disabled="submitting">
                    <i v-if="submitting" class="pi pi-spin pi-spinner" />
                    <span>{{ t('login.submit') }}</span>
                </button>
            </form>

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
        radial-gradient(1200px 600px at 100% -10%, rgba(15, 118, 110, 0.14), transparent 60%),
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
    box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.15);
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
.login__hint { text-align: center; color: var(--vc-text-muted); font-size: 0.8rem; margin: 1.25rem 0 0; }
</style>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import * as flags from 'country-flag-icons/string/3x2'
import { PHONE_COUNTRIES, findCountry, joinPhone, splitPhone } from '@/shared/infrastructure/phone-countries.js'

const props = defineProps({
    modelValue: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
    boxed: { type: Boolean, default: true },
    placeholder: { type: String, default: '987 654 321' },
    inputClass: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue', 'input'])

const { t, locale } = useI18n()
const iso = ref(splitPhone(props.modelValue).iso)
const number = ref(splitPhone(props.modelValue).number)
const open = ref(false)
const root = ref(null)

const country = computed(() => findCountry(iso.value))
const regionNames = computed(() => {
    try {
        return new Intl.DisplayNames([locale.value], { type: 'region' })
    } catch {
        return null
    }
})

function countryName(code) {
    return regionNames.value?.of(code) ?? code
}

const sortedCountries = computed(() =>
    [...PHONE_COUNTRIES].sort((a, b) => countryName(a.iso).localeCompare(countryName(b.iso), locale.value)))

watch(() => props.modelValue, value => {
    if (value === joinPhone(iso.value, number.value)) return
    const parts = splitPhone(value)
    iso.value = parts.iso
    number.value = parts.number
})

function publish() {
    emit('update:modelValue', joinPhone(iso.value, number.value))
    emit('input')
}

function onNumberInput(event) {
    const pasted = event.target.value
    if (pasted.trim().startsWith('+')) {
        const parts = splitPhone(pasted)
        iso.value = parts.iso
        number.value = parts.number
    } else {
        number.value = pasted.replace(/[^\d ]/g, '').replace(/ {2,}/g, ' ').slice(0, 18)
    }
    event.target.value = number.value
    publish()
}

function choose(code) {
    iso.value = code
    open.value = false
    publish()
}

function toggle() {
    if (!props.disabled) open.value = !open.value
}

function onOutside(event) {
    if (root.value && !root.value.contains(event.target)) open.value = false
}

onMounted(() => document.addEventListener('mousedown', onOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onOutside))
</script>

<template>
    <span ref="root" class="phone-input" :class="{ 'phone-input--boxed': boxed, 'is-disabled': disabled }" @keydown.esc="open = false">
        <button
            type="button"
            class="phone-input__country"
            :disabled="disabled"
            :aria-label="t('common.country')"
            :aria-expanded="open"
            @click.prevent="toggle"
        >
            <span class="phone-input__flag" v-html="flags[country.iso]" />
            <span class="phone-input__dial">+{{ country.dial }}</span>
            <i class="pi pi-chevron-down phone-input__chevron" />
        </button>
        <input
            :value="number"
            type="tel"
            inputmode="tel"
            autocomplete="tel-national"
            class="phone-input__number"
            :class="inputClass"
            :placeholder="placeholder"
            :disabled="disabled"
            maxlength="18"
            @input="onNumberInput"
        />
        <ul v-if="open" class="phone-input__list" role="listbox">
            <li
                v-for="c in sortedCountries"
                :key="c.iso"
                role="option"
                :aria-selected="c.iso === iso"
                class="phone-input__option"
                :class="{ 'is-selected': c.iso === iso }"
                @mousedown.prevent="choose(c.iso)"
            >
                <span class="phone-input__flag" v-html="flags[c.iso]" />
                <span class="phone-input__name">{{ countryName(c.iso) }}</span>
                <span class="phone-input__code">+{{ c.dial }}</span>
            </li>
        </ul>
    </span>
</template>

<style scoped>
.phone-input { position: relative; display: flex; align-items: center; gap: 0.4rem; width: 100%; min-width: 0; }
.phone-input--boxed {
    border: 1px solid var(--vc-border);
    border-radius: 10px;
    background: var(--vc-surface-2);
    padding: 0 0.6rem 0 0.35rem;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.phone-input--boxed:focus-within { border-color: var(--vc-brand-500); box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12); }
.phone-input.is-disabled { opacity: 0.7; }
.phone-input__country {
    display: inline-flex; align-items: center; gap: 0.3rem; flex-shrink: 0;
    border: none; background: transparent; color: var(--vc-text);
    padding: 0.35rem 0.4rem; border-radius: 8px; cursor: pointer; font: inherit; font-size: 0.9rem;
}
.phone-input__country:hover:not(:disabled) { background: rgba(22, 163, 74, 0.08); }
.phone-input__country:disabled { cursor: default; }
.phone-input__flag { display: inline-flex; width: 22px; height: 15px; flex-shrink: 0; border-radius: 2px; overflow: hidden; box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08); }
.phone-input__flag :deep(svg) { width: 100%; height: 100%; display: block; }
.phone-input__dial { font-weight: 600; }
.phone-input__chevron { font-size: 0.65rem; color: var(--vc-text-muted); }
.phone-input__number {
    flex: 1; min-width: 0; border: none; outline: none; background: transparent;
    font: inherit; color: var(--vc-text); padding: 0.6rem 0.25rem;
}
.phone-input__list {
    position: absolute; top: calc(100% + 4px); left: 0; z-index: 30;
    width: min(300px, 90vw); max-height: 260px; overflow-y: auto;
    margin: 0; padding: 0.3rem; list-style: none;
    background: var(--vc-surface); border: 1px solid var(--vc-border); border-radius: 10px;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.15);
}
.phone-input__option {
    display: flex; align-items: center; gap: 0.55rem;
    padding: 0.45rem 0.55rem; border-radius: 8px; cursor: pointer; font-size: 0.9rem; color: var(--vc-text);
}
.phone-input__option:hover, .phone-input__option.is-selected { background: rgba(22, 163, 74, 0.1); }
.phone-input__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.phone-input__code { color: var(--vc-text-muted); font-variant-numeric: tabular-nums; }
</style>

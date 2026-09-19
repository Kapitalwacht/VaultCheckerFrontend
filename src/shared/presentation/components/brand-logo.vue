<script setup>
defineProps({
    size: { type: Number, default: 28 },
    showText: { type: Boolean, default: true },
    color: { type: String, default: 'currentColor' }
})
</script>

<template>
    <span class="brand" :style="{ color }">
        <svg class="brand__mark" :width="size" :height="size" viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="16" cy="16" r="12.6" fill="none" stroke="#16a34a" stroke-width="3.4" />
            <path d="M9.5 11.4 L16 21.6 L22.5 11.4" fill="none" stroke="#16a34a" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span v-if="showText" class="brand__text">
            Vault<span class="brand__text--accent">Checker</span>
        </span>
    </span>
</template>

<style scoped>
.brand {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
}
.brand__mark { flex: none; }
.brand__text {
    font-weight: 800;
    font-size: 1.15rem;
    letter-spacing: -0.01em;
    white-space: nowrap;
}
.brand__text--accent { font-weight: 500; opacity: 0.9; }
</style>

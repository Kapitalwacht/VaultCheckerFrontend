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
            <rect x="1" y="1" width="30" height="30" rx="7" fill="none" stroke="currentColor" stroke-width="2" opacity="0.35" />
            <circle cx="16" cy="16" r="8.5" fill="none" stroke="currentColor" stroke-width="2" />
            <circle cx="16" cy="16" r="2.6" fill="currentColor" />
            <line x1="16" y1="7.5" x2="16" y2="5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <line x1="16" y1="24.5" x2="16" y2="27" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <line x1="7.5" y1="16" x2="5" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <line x1="24.5" y1="16" x2="27" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
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

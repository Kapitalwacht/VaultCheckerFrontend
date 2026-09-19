<script setup>
defineProps({
    label: { type: String, required: true },
    tone: {
        type: String,
        default: 'neutral',
        validator: value => ['success', 'neutral', 'danger', 'accent', 'info'].includes(value)
    }
})
</script>

<template>
    <span class="vc-badge" :class="`vc-badge--${tone}`">{{ label }}</span>
</template>

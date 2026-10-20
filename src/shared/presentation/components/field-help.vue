<script>
import { ref } from 'vue'

const activeHelp = ref(null)
</script>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps({
    tip: { type: String, required: true }
})

const { t } = useI18n()
const id = Symbol('field-help')
const open = computed(() => activeHelp.value === id)

function toggle() {
    activeHelp.value = open.value ? null : id
}

function close() {
    if (open.value) activeHelp.value = null
}
</script>

<template>
    <span
        class="vc-help"
        :class="{ 'is-open': open }"
        role="button"
        tabindex="0"
        :aria-label="t('common.help')"
        :aria-expanded="open"
        @click.prevent.stop="toggle"
        @keydown.enter.prevent.stop="toggle"
        @keydown.space.prevent.stop="toggle"
        @keydown.esc="close"
        @blur="close"
    >
        <span class="vc-help__icon" aria-hidden="true">?</span>
        <span class="vc-help__tip" role="tooltip">{{ tip }}</span>
    </span>
</template>

<script setup>

import { watch, onBeforeUnmount } from 'vue'

const props = defineProps({
    open: { type: Boolean, default: false },
    title: { type: String, default: '' }
})

const emit = defineEmits(['close'])

function onKey(e) {
    if (e.key === 'Escape') emit('close')
}

watch(
    () => props.open,
    open => {
        if (open) {
            document.addEventListener('keydown', onKey)
            document.body.style.overflow = 'hidden'
        } else {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
    }
)

onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKey)
    document.body.style.overflow = ''
})

</script>

<template>
    <Teleport to="body">
        <Transition name="vc-modal">
            <div v-if="open" class="vc-modal" @click.self="emit('close')">
                <div class="vc-modal__card vc-card" role="dialog" aria-modal="true">
                    <header class="vc-modal__head">
                        <h2 class="vc-modal__title">{{ title }}</h2>
                        <button class="vc-modal__close" type="button" aria-label="Close" @click="emit('close')">
                            <i class="pi pi-times" />
                        </button>
                    </header>
                    <div class="vc-modal__body">
                        <slot />
                    </div>
                    <footer v-if="$slots.footer" class="vc-modal__footer">
                        <slot name="footer" />
                    </footer>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.vc-modal {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: grid;
    place-items: center;
    padding: 1.25rem;
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(2px);
}
.vc-modal__card {
    width: 100%;
    max-width: 560px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
.vc-modal__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.1rem 1.35rem;
    border-bottom: 1px solid var(--vc-border);
}
.vc-modal__title { margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--vc-text); }
.vc-modal__close {
    border: none; background: transparent; cursor: pointer;
    color: var(--vc-text-muted); font-size: 1.1rem;
    padding: 0.3rem 0.4rem; border-radius: 8px;
}
.vc-modal__close:hover { background: var(--vc-surface-2); color: var(--vc-text); }
.vc-modal__body { padding: 1.35rem; overflow-y: auto; }
.vc-modal__footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.6rem;
    padding: 1rem 1.35rem;
    border-top: 1px solid var(--vc-border);
    background: var(--vc-surface-2);
}

.vc-modal-enter-active, .vc-modal-leave-active { transition: opacity 0.18s ease; }
.vc-modal-enter-from, .vc-modal-leave-to { opacity: 0; }
.vc-modal-enter-active .vc-modal__card { transition: transform 0.18s ease; }
.vc-modal-enter-from .vc-modal__card { transform: translateY(12px); }
</style>

import { computed } from 'vue'
import useIamStore from '@/iam/application/iam.store.js'

export function useStoreScope() {
    const iamStore = useIamStore()

    const scopeStoreId = computed(() => (iamStore.isSystemAdmin ? null : iamStore.storeId))

    function inScope(item) {
        if (!scopeStoreId.value) return true
        return item.storeId === scopeStoreId.value
    }

    function scope(items) {
        return (items || []).filter(inScope)
    }

    return { scopeStoreId, inScope, scope }
}

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { StoresApi } from '@/stores/infrastructure/stores-api.js'
import { StoreAssembler } from '@/stores/infrastructure/store.assembler.js'

const storesApi = new StoresApi()

const useStoresStore = defineStore('stores', () => {
    const stores = ref([])
    const loading = ref(false)
    const error = ref(null)

    const activeStores = computed(() => stores.value.filter(store => store.isActive))

    function fetchStores() {
        loading.value = true
        error.value = null
        return storesApi.getAllStores()
            .then(response => {
                stores.value = (response.data || []).map(StoreAssembler.toEntityFromResource)
                loading.value = false
            })
            .catch(err => {
                error.value = err.message
                loading.value = false
            })
    }

    function createStore(store) {
        return storesApi.createStore(StoreAssembler.toResourceFromEntity(store))
            .then(response => {
                const created = StoreAssembler.toEntityFromResource(response.data)
                stores.value.push(created)
                return created
            })
    }

    function updateStore(id, store) {
        return storesApi.updateStore(id, StoreAssembler.toResourceFromEntity(store))
            .then(response => {
                const updated = StoreAssembler.toEntityFromResource(response.data)
                const index = stores.value.findIndex(item => item.id === id)
                if (index !== -1) stores.value[index] = updated
                return updated
            })
    }

    return { stores, loading, error, activeStores, fetchStores, createStore, updateStore }
})

export default useStoresStore

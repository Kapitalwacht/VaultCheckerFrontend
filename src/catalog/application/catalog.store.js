import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { CatalogApi } from '@/catalog/infrastructure/catalog-api.js'
import { ProductAssembler } from '@/catalog/infrastructure/product.assembler.js'

const catalogApi = new CatalogApi()

const useCatalogStore = defineStore('catalog', () => {
    const products = ref([])
    const loading = ref(false)
    const error = ref(null)

    const availableProducts = computed(() => products.value.filter(product => product.isAvailable))

    function fetchProducts() {
        loading.value = true
        error.value = null
        return catalogApi.getAllProducts()
            .then(response => {
                products.value = (response.data || []).map(ProductAssembler.toEntityFromResource)
                loading.value = false
            })
            .catch(err => {
                error.value = err.message
                loading.value = false
            })
    }

    function createProduct(product) {
        return catalogApi.createProduct(ProductAssembler.toResourceFromEntity(product))
            .then(response => {
                const created = ProductAssembler.toEntityFromResource(response.data)
                products.value.push(created)
                return created
            })
    }

    function updateProduct(id, product) {
        return catalogApi.updateProduct(id, ProductAssembler.toResourceFromEntity(product))
            .then(response => {
                const updated = ProductAssembler.toEntityFromResource(response.data)
                const index = products.value.findIndex(item => item.id === id)
                if (index !== -1) products.value[index] = updated
                return updated
            })
    }

    function deleteProduct(id) {
        return catalogApi.deleteProduct(id).then(() => {
            products.value = products.value.filter(item => item.id !== id)
        })
    }

    return { products, loading, error, availableProducts, fetchProducts, createProduct, updateProduct, deleteProduct }
})

export default useCatalogStore

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { CustomersApi } from '@/customers/infrastructure/customers-api.js'
import { CustomerAssembler } from '@/customers/infrastructure/customer.assembler.js'

const customersApi = new CustomersApi()

const useCustomersStore = defineStore('customers', () => {
    const customers = ref([])
    const loading = ref(false)
    const error = ref(null)

    const activeCustomers = computed(() => customers.value.filter(customer => customer.isActive))

    function fetchCustomers() {
        loading.value = true
        error.value = null
        return customersApi.getAllCustomers()
            .then(response => {
                customers.value = (response.data || []).map(CustomerAssembler.toEntityFromResource)
                loading.value = false
            })
            .catch(err => {
                error.value = err.message
                loading.value = false
            })
    }

    function createCustomer(customer) {
        return customersApi.createCustomer(CustomerAssembler.toResourceFromEntity(customer))
            .then(response => {
                const created = CustomerAssembler.toEntityFromResource(response.data)
                customers.value.push(created)
                return created
            })
    }

    function updateCustomer(id, customer) {
        return customersApi.updateCustomer(id, CustomerAssembler.toResourceFromEntity(customer))
            .then(response => {
                const updated = CustomerAssembler.toEntityFromResource(response.data)
                const index = customers.value.findIndex(item => item.id === id)
                if (index !== -1) customers.value[index] = updated
                return updated
            })
    }

    function deleteCustomer(id) {
        return customersApi.deleteCustomer(id).then(() => {
            customers.value = customers.value.filter(item => item.id !== id)
        })
    }

    return { customers, loading, error, activeCustomers, fetchCustomers, createCustomer, updateCustomer, deleteCustomer }
})

export default useCustomersStore

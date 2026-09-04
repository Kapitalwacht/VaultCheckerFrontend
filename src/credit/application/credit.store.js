import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { CreditApi } from '@/credit/infrastructure/credit-api.js'
import { CreditAccountAssembler } from '@/credit/infrastructure/credit-account.assembler.js'

const creditApi = new CreditApi()

const useCreditStore = defineStore('credit', () => {
    const accounts = ref([])
    const loading = ref(false)
    const error = ref(null)

    const overdueAccounts = computed(() => accounts.value.filter(account => account.isOverdue))
    const totalOutstanding = computed(() =>
        accounts.value.reduce((sum, account) => sum + Number(account.balance || 0), 0))

    function fetchAccounts() {
        loading.value = true
        error.value = null
        return creditApi.getAllCreditAccounts()
            .then(response => {
                accounts.value = (response.data || []).map(CreditAccountAssembler.toEntityFromResource)
                loading.value = false
            })
            .catch(err => {
                error.value = err.message
                loading.value = false
            })
    }

    function openAccount(account) {
        return creditApi.createCreditAccount(CreditAccountAssembler.toResourceFromEntity(account))
            .then(response => {
                const created = CreditAccountAssembler.toEntityFromResource(response.data)
                accounts.value.push(created)
                return created
            })
    }

    function registerPayment(payment) {
        return creditApi.registerPayment(payment).then(response => {
            fetchAccounts()
            return response.data
        })
    }

    return { accounts, loading, error, overdueAccounts, totalOutstanding, fetchAccounts, openAccount, registerPayment }
})

export default useCreditStore

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { CreditApi } from '@/credit/infrastructure/credit-api.js'
import { CreditAccountAssembler } from '@/credit/infrastructure/credit-account.assembler.js'
import { PurchaseAssembler } from '@/credit/infrastructure/purchase.assembler.js'
import { InstallmentPaymentAssembler } from '@/credit/infrastructure/installment-payment.assembler.js'
import { roundMoney } from '@/credit/domain/services/finance.js'
import useAuditStore from '@/audit/application/audit.store.js'

const creditApi = new CreditApi()

const useCreditStore = defineStore('credit', () => {
    const accounts = ref([])
    const purchases = ref([])
    const installmentPayments = ref([])
    const loading = ref(false)
    const error = ref(null)

    const overdueAccounts = computed(() => accounts.value.filter(account => account.isOverdue))
    const totalOutstanding = computed(() =>
        accounts.value.reduce((sum, account) => sum + Number(account.balance || 0), 0))

    function outstandingByCustomer(customerId) {
        return roundMoney(purchases.value
            .filter(p => p.customerId === customerId && p.isActive)
            .reduce((sum, p) => sum + Number(p.amount || 0), 0))
    }

    function availableCreditFor(customer) {
        const limit = Number(customer?.creditLimit || 0)
        return roundMoney(limit - outstandingByCustomer(customer?.id))
    }

    function purchasesByCustomer(customerId) {
        return purchases.value.filter(p => p.customerId === customerId)
    }

    function paymentsForPurchase(purchaseId) {
        return installmentPayments.value.filter(p => p.purchaseId === purchaseId)
    }

    function isPeriodPaid(purchaseId, period) {
        return installmentPayments.value.some(p => p.purchaseId === purchaseId && p.period === period)
    }

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

    function fetchPurchases() {
        loading.value = true
        error.value = null
        return creditApi.getAllPurchases()
            .then(response => {
                purchases.value = (response.data || []).map(PurchaseAssembler.toEntityFromResource)
                loading.value = false
            })
            .catch(err => {
                error.value = err.message
                loading.value = false
            })
    }

    function fetchInstallmentPayments() {
        loading.value = true
        error.value = null
        return creditApi.getAllInstallmentPayments()
            .then(response => {
                installmentPayments.value = (response.data || [])
                    .map(InstallmentPaymentAssembler.toEntityFromResource)
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

    function registerPurchase(purchase, customer) {
        const amount = Number(purchase.amount) || 0
        const months = Number(purchase.months) || 1
        const available = availableCreditFor(customer)
        if (amount > available) {
            return Promise.reject(new Error('credit-limit-exceeded'))
        }
        if (months > Number(customer.maxMonths || 1)) {
            return Promise.reject(new Error('max-months-exceeded'))
        }
        return creditApi.createPurchase(PurchaseAssembler.toResourceFromEntity(purchase))
            .then(response => {
                const created = PurchaseAssembler.toEntityFromResource(response.data)
                purchases.value.push(created)
                useAuditStore().recordAction(
                    'REGISTER_PURCHASE',
                    `Purchase of ${created.description || 'item'} for ${created.amount} (${created.months} months)`
                )
                return created
            })
    }

    function registerInstallmentPayment(payment) {
        if (isPeriodPaid(payment.purchaseId, payment.period)) {
            return Promise.reject(new Error('installment-already-paid'))
        }
        if (payment.period > 1 && !isPeriodPaid(payment.purchaseId, payment.period - 1)) {
            return Promise.reject(new Error('previous-installment-pending'))
        }
        return creditApi.createInstallmentPayment(
            InstallmentPaymentAssembler.toResourceFromEntity(payment)
        ).then(response => {
            const created = InstallmentPaymentAssembler.toEntityFromResource(response.data)
            installmentPayments.value.push(created)
            useAuditStore().recordAction(
                'REGISTER_INSTALLMENT_PAYMENT',
                `Installment #${created.period} paid ${created.total} (late fee ${created.lateFee})`
            )
            return created
        })
    }

    function registerPayment(payment) {
        return creditApi.registerPayment(payment).then(response => {
            fetchAccounts()
            return response.data
        })
    }

    return {
        accounts,
        purchases,
        installmentPayments,
        loading,
        error,
        overdueAccounts,
        totalOutstanding,
        outstandingByCustomer,
        availableCreditFor,
        purchasesByCustomer,
        paymentsForPurchase,
        isPeriodPaid,
        fetchAccounts,
        fetchPurchases,
        fetchInstallmentPayments,
        openAccount,
        registerPurchase,
        registerInstallmentPayment,
        registerPayment
    }
})

export default useCreditStore

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { AuditApi } from '@/audit/infrastructure/audit-api.js'
import { AuditLogAssembler } from '@/audit/infrastructure/audit-log.assembler.js'

const auditApi = new AuditApi()

const useAuditStore = defineStore('audit', () => {
    const logs = ref([])
    const loading = ref(false)
    const error = ref(null)

    function fetchLogs() {
        loading.value = true
        error.value = null
        return auditApi.getAllLogs()
            .then(response => {
                logs.value = (response.data || [])
                    .map(AuditLogAssembler.toEntityFromResource)
                    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
                loading.value = false
            })
            .catch(err => {
                error.value = err.message
                loading.value = false
            })
    }

    return { logs, loading, error, fetchLogs }
})

export default useAuditStore

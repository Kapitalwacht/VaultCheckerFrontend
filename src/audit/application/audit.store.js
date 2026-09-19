import { defineStore } from 'pinia'
import { ref } from 'vue'
import { AuditApi } from '@/audit/infrastructure/audit-api.js'
import { AuditLogAssembler } from '@/audit/infrastructure/audit-log.assembler.js'
import useIamStore from '@/iam/application/iam.store.js'

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

    function recordAction(action, details) {
        const iam = useIamStore()
        const now = new Date()
        const resource = {
            auditId: `AU-${now.getTime()}`,
            userRole: iam.role ?? 'store-admin',
            action,
            date: now.toISOString().slice(0, 10),
            time: now.toTimeString().slice(0, 5),
            details
        }
        return auditApi.createLog(resource)
            .then(response => {
                logs.value.unshift(AuditLogAssembler.toEntityFromResource(response.data))
            })
            .catch(() => { /* auditing must never block the main operation */ })
    }

    return { logs, loading, error, fetchLogs, recordAction }
})

export default useAuditStore

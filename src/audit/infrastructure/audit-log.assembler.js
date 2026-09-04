import { AuditLog } from '@/audit/domain/model/audit-log-entity.js'

export class AuditLogAssembler {
    static toEntityFromResource(resource) {
        return new AuditLog({
            id: resource.id,
            auditId: resource.auditId,
            userRole: resource.userRole,
            action: resource.action,
            date: resource.date,
            time: resource.time,
            details: resource.details
        })
    }

    static toResourceFromEntity(log) {
        return {
            auditId: log.auditId,
            userRole: log.userRole,
            action: log.action,
            date: log.date,
            time: log.time,
            details: log.details
        }
    }
}

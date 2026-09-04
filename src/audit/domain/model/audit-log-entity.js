export class AuditLog {
    constructor({
        id = null,
        auditId = null,
        userRole = '',
        action = '',
        date = '',
        time = '',
        details = ''
    } = {}) {
        this.id = id
        this.auditId = auditId
        this.userRole = userRole
        this.action = action
        this.date = date
        this.time = time
        this.details = details
    }
}

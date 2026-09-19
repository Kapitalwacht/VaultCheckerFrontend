import { BaseApi } from '@/shared/infrastructure/base-api.js'
import { BaseEndpoint } from '@/shared/infrastructure/base-endpoint.js'

const auditPath = '/audit-logs'

export class AuditApi extends BaseApi {
    #auditEndpoint

    constructor() {
        super()
        this.#auditEndpoint = new BaseEndpoint(this, auditPath)
    }

    getAllLogs() { return this.#auditEndpoint.getAll() }

    getLogById(id) { return this.#auditEndpoint.getById(id) }

    getLogsByDate(date) { return this.http.get(`${auditPath}?date=${date}`) }

    createLog(log) { return this.#auditEndpoint.create(log) }
}

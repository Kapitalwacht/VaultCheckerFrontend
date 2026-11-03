import { Roles } from '@/iam/domain/model/roles.js'

const auditRoutes = [
    {
        path: 'audit',
        name: 'audit',
        component: () => import('@/audit/presentation/views/audit-list.vue'),
        meta: { title: 'nav.audit', roles: [Roles.SYSTEM_ADMIN, Roles.STORE_ADMIN] }
    }
]

export default auditRoutes

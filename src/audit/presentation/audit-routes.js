const auditRoutes = [
    {
        path: 'audit',
        name: 'audit',
        component: () => import('@/audit/presentation/views/audit-list.vue'),
        meta: { title: 'nav.audit' }
    }
]

export default auditRoutes

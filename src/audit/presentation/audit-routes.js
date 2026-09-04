const auditRoutes = [
    {
        path: 'audit',
        name: 'audit',
        component: () => import('@/shared/presentation/views/coming-soon.vue'),
        meta: { title: 'nav.audit' }
    }
]

export default auditRoutes

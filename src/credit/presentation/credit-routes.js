const creditRoutes = [
    {
        path: 'credit',
        name: 'credit',
        component: () => import('@/credit/presentation/views/credit-list.vue'),
        meta: { title: 'nav.credit' }
    },
    {
        path: 'credit/plan',
        name: 'credit-plan',
        component: () => import('@/credit/presentation/views/credit-plan.vue'),
        meta: { title: 'nav.plan' }
    },
    {
        path: 'credit/report',
        name: 'credit-report',
        component: () => import('@/credit/presentation/views/credit-report.vue'),
        meta: { title: 'nav.report' }
    }
]

export default creditRoutes

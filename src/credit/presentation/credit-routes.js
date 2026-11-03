import { Roles } from '@/iam/domain/model/roles.js'

const creditRoutes = [
    {
        path: 'credit',
        name: 'credit',
        component: () => import('@/credit/presentation/views/credit-list.vue'),
        meta: { title: 'nav.credit', roles: [Roles.STORE_ADMIN] }
    },
    {
        path: 'credit/plan',
        name: 'credit-plan',
        component: () => import('@/credit/presentation/views/credit-plan.vue'),
        meta: { title: 'nav.plan', roles: [Roles.STORE_ADMIN] }
    },
    {
        path: 'credit/report',
        name: 'credit-report',
        component: () => import('@/credit/presentation/views/credit-report.vue'),
        meta: { title: 'nav.report', roles: [Roles.STORE_ADMIN, Roles.CUSTOMER] }
    }
]

export default creditRoutes

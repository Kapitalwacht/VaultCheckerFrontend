import { Roles } from '@/iam/domain/model/roles.js'

const subscriptionsRoutes = [
    {
        path: 'billing',
        name: 'billing',
        component: () => import('@/subscriptions/presentation/views/billing.vue'),
        meta: { title: 'nav.billing', roles: [Roles.STORE_ADMIN] }
    }
]

export default subscriptionsRoutes

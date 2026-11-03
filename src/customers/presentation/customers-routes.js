import { Roles } from '@/iam/domain/model/roles.js'

const customersRoutes = [
    {
        path: 'customers',
        name: 'customers',
        component: () => import('@/customers/presentation/views/customers-list.vue'),
        meta: { title: 'nav.customers', roles: [Roles.STORE_ADMIN] }
    }
]

export default customersRoutes

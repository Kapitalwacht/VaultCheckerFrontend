import { Roles } from '@/iam/domain/model/roles.js'

const storesRoutes = [
    {
        path: 'stores',
        name: 'stores',
        component: () => import('@/stores/presentation/views/stores-list.vue'),
        meta: { title: 'nav.stores', roles: [Roles.SYSTEM_ADMIN] }
    }
]

export default storesRoutes

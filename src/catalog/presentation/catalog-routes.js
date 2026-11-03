import { Roles } from '@/iam/domain/model/roles.js'

const catalogRoutes = [
    {
        path: 'catalog',
        name: 'catalog',
        component: () => import('@/catalog/presentation/views/catalog-list.vue'),
        meta: { title: 'nav.catalog', roles: [Roles.STORE_ADMIN] }
    }
]

export default catalogRoutes

const catalogRoutes = [
    {
        path: 'catalog',
        name: 'catalog',
        component: () => import('@/catalog/presentation/views/catalog-list.vue'),
        meta: { title: 'nav.catalog' }
    }
]

export default catalogRoutes

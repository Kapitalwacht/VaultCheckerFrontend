const catalogRoutes = [
    {
        path: 'catalog',
        name: 'catalog',
        component: () => import('@/shared/presentation/views/coming-soon.vue'),
        meta: { title: 'nav.catalog' }
    }
]

export default catalogRoutes

const storesRoutes = [
    {
        path: 'stores',
        name: 'stores',
        component: () => import('@/shared/presentation/views/coming-soon.vue'),
        meta: { title: 'nav.stores' }
    }
]

export default storesRoutes

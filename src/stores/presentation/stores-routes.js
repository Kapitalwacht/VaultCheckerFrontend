const storesRoutes = [
    {
        path: 'stores',
        name: 'stores',
        component: () => import('@/stores/presentation/views/stores-list.vue'),
        meta: { title: 'nav.stores' }
    }
]

export default storesRoutes

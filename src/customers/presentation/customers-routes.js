const customersRoutes = [
    {
        path: 'customers',
        name: 'customers',
        component: () => import('@/shared/presentation/views/coming-soon.vue'),
        meta: { title: 'nav.customers' }
    }
]

export default customersRoutes

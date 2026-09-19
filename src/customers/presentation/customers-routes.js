const customersRoutes = [
    {
        path: 'customers',
        name: 'customers',
        component: () => import('@/customers/presentation/views/customers-list.vue'),
        meta: { title: 'nav.customers' }
    }
]

export default customersRoutes

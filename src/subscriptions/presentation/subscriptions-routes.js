const subscriptionsRoutes = [
    {
        path: 'billing',
        name: 'billing',
        component: () => import('@/subscriptions/presentation/views/billing.vue'),
        meta: { title: 'nav.billing' }
    }
]

export default subscriptionsRoutes

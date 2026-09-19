import { createRouter, createWebHistory } from 'vue-router'
import useIamStore from '@/iam/application/iam.store.js'
import storesRoutes from '@/stores/presentation/stores-routes.js'
import customersRoutes from '@/customers/presentation/customers-routes.js'
import catalogRoutes from '@/catalog/presentation/catalog-routes.js'
import creditRoutes from '@/credit/presentation/credit-routes.js'
import auditRoutes from '@/audit/presentation/audit-routes.js'

const DashboardLayout = () => import('@/shared/presentation/components/dashboard-layout.vue')
const HomeView = () => import('@/shared/presentation/views/home.vue')
const PageNotFoundView = () => import('@/shared/presentation/views/page-not-found.vue')
const LoginView = () => import('@/iam/presentation/views/login.vue')
const PasswordRecoveryView = () => import('@/iam/presentation/views/password-recovery.vue')
const ProfileView = () => import('@/iam/presentation/views/profile.vue')

const routes = [
    {
        path: '/login',
        name: 'login',
        component: LoginView,
        meta: { public: true, title: 'nav.login' }
    },
    {
        path: '/recover',
        name: 'recover',
        component: PasswordRecoveryView,
        meta: { public: true, title: 'nav.login' }
    },
    {
        path: '/',
        component: DashboardLayout,
        children: [
            { path: '', redirect: { name: 'home' } },
            { path: 'home', name: 'home', component: HomeView, meta: { title: 'nav.home' } },
            { path: 'profile', name: 'profile', component: ProfileView, meta: { title: 'profile.title' } },
            ...storesRoutes,
            ...customersRoutes,
            ...catalogRoutes,
            ...creditRoutes,
            ...auditRoutes
        ]
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: PageNotFoundView,
        meta: { public: true }
    }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior() {
        return { top: 0 }
    }
})

router.beforeEach(to => {
    const iam = useIamStore()
    if (!to.meta?.public && !iam.isAuthenticated) {
        return { name: 'login', query: { redirect: to.fullPath } }
    }
    if (to.name === 'login' && iam.isAuthenticated) {
        return { name: 'home' }
    }
    return true
})

router.afterEach(() => {
    document.title = 'VaultChecker'
})

export default router

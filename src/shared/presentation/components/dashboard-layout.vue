<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import BrandLogo from '@/shared/presentation/components/brand-logo.vue'
import { setLocale } from '@/i18n.js'
import useIamStore from '@/iam/application/iam.store.js'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const iamStore = useIamStore()
const { currentUser, role } = storeToRefs(iamStore)

const mobileMenuOpen = ref(false)
const isDark = ref(false)

const allNavItems = [
    { labelKey: 'nav.home',      icon: 'pi-th-large',   to: '/home',          roles: ['system-admin', 'store-admin', 'customer'] },
    { labelKey: 'nav.stores',    icon: 'pi-building',    to: '/stores',        roles: ['system-admin', 'store-admin'] },
    { labelKey: 'nav.customers', icon: 'pi-users',       to: '/customers',     roles: ['store-admin'] },
    { labelKey: 'nav.catalog',   icon: 'pi-box',         to: '/catalog',       roles: ['store-admin'] },
    { labelKey: 'nav.credit',    icon: 'pi-credit-card', to: '/credit',        roles: ['store-admin'] },
    { labelKey: 'nav.plan',      icon: 'pi-calculator',  to: '/credit/plan',   roles: ['store-admin'] },
    { labelKey: 'nav.report',    icon: 'pi-file',        to: '/credit/report', roles: ['store-admin', 'customer'] },
    { labelKey: 'nav.billing',   icon: 'pi-wallet',      to: '/billing',       roles: ['store-admin'] },
    { labelKey: 'nav.audit',     icon: 'pi-history',     to: '/audit',         roles: ['system-admin', 'store-admin'] }
]

const navItems = computed(() =>
    allNavItems.filter(item => !role.value || item.roles.includes(role.value)))

function toggleMobileMenu() { mobileMenuOpen.value = !mobileMenuOpen.value }
function closeMobileMenu() { mobileMenuOpen.value = false }

function toggleTheme() {
    isDark.value = !isDark.value
    document.documentElement.classList.toggle('app-dark', isDark.value)
}

function toggleLocale() {
    setLocale(locale.value === 'es' ? 'en' : 'es')
}

function logout() {
    closeMobileMenu()
    iamStore.logout()
    router.push('/login')
}

watch(() => route.fullPath, () => closeMobileMenu())
</script>

<template>
    <div class="shell" :class="{ 'shell--menu-open': mobileMenuOpen }">
        <header class="topbar">
            <button class="icon-btn" :aria-label="t('nav.menu')" @click="toggleMobileMenu">
                <i class="pi pi-bars" />
            </button>
            <BrandLogo :size="24" class="topbar__brand" />
            <button class="icon-btn" :aria-label="t('nav.theme')" @click="toggleTheme">
                <i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'" />
            </button>
        </header>

        <div class="backdrop" @click="closeMobileMenu" />

        <aside class="sidebar">
            <div class="sidebar__brand">
                <BrandLogo :size="30" />
            </div>

            <nav class="sidebar__nav">
                <RouterLink
                    v-for="item in navItems"
                    :key="item.to"
                    :to="item.to"
                    class="nav-item"
                    active-class="nav-item--active"
                >
                    <i class="nav-item__icon pi" :class="item.icon" />
                    <span class="nav-item__label">{{ t(item.labelKey) }}</span>
                </RouterLink>
            </nav>

            <div class="sidebar__footer">
                <RouterLink v-if="currentUser" to="/profile" class="sidebar__user" active-class="sidebar__user--active">
                    <span class="sidebar__user-info">
                        <span class="sidebar__user-name">{{ currentUser.name || currentUser.email }}</span>
                        <span class="sidebar__user-role">{{ t(`roles.${currentUser.role}`, currentUser.role) }}</span>
                    </span>
                    <i class="pi pi-pencil sidebar__user-edit" />
                </RouterLink>
                <button class="ghost-btn" @click="toggleLocale">
                    <i class="pi pi-globe" />
                    <span>{{ locale === 'es' ? 'EN' : 'ES' }}</span>
                </button>
                <button class="ghost-btn ghost-btn--desktop-theme" @click="toggleTheme">
                    <i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'" />
                    <span>{{ isDark ? t('nav.light') : t('nav.dark') }}</span>
                </button>
                <button class="ghost-btn ghost-btn--logout" @click="logout">
                    <i class="pi pi-sign-out" />
                    <span>{{ t('nav.logout') }}</span>
                </button>
            </div>
        </aside>

        <main class="content">
            <RouterView />
        </main>
    </div>
</template>

<style scoped>
.shell {
    min-height: 100vh;
    display: grid;
    grid-template-columns: var(--vc-sidebar-width) 1fr;
    background: var(--vc-bg);
}

.sidebar {
    grid-row: 1 / -1;
    display: flex;
    flex-direction: column;
    background: var(--vc-sidebar-bg);
    color: var(--vc-sidebar-text);
    padding: 1.25rem 0.85rem;
    position: sticky;
    top: 0;
    height: 100vh;
}
.sidebar__brand {
    color: var(--vc-sidebar-text-strong);
    padding: 0.4rem 0.6rem 1.4rem;
}
.sidebar__nav {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    flex: 1;
}
.nav-item {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.7rem 0.85rem;
    border-radius: 10px;
    color: var(--vc-sidebar-text);
    font-weight: 500;
    font-size: 0.95rem;
    transition: background 0.15s ease, color 0.15s ease;
}
.nav-item:hover { background: var(--vc-sidebar-hover-bg); color: var(--vc-sidebar-text-strong); }
.nav-item--active {
    background: var(--vc-sidebar-active-bg);
    color: var(--vc-sidebar-text-strong);
    font-weight: 600;
}
.nav-item__icon { font-size: 1.1rem; width: 1.2rem; text-align: center; }

.sidebar__footer {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    padding-top: 0.8rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.sidebar__user {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.5rem 0.85rem;
    border-radius: 10px;
    margin-bottom: 0.2rem;
    transition: background 0.15s ease;
}
.sidebar__user:hover, .sidebar__user--active { background: var(--vc-sidebar-hover-bg); }
.sidebar__user-info { display: flex; flex-direction: column; min-width: 0; }
.sidebar__user-name { color: var(--vc-sidebar-text-strong); font-weight: 600; font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sidebar__user-role { color: var(--vc-sidebar-text); font-size: 0.78rem; text-transform: capitalize; }
.sidebar__user-edit { color: var(--vc-sidebar-text); font-size: 0.85rem; flex: none; }
.ghost-btn {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.6rem 0.85rem;
    background: transparent;
    border: none;
    border-radius: 10px;
    color: var(--vc-sidebar-text);
    font: inherit;
    font-size: 0.9rem;
    cursor: pointer;
    text-align: left;
}
.ghost-btn:hover { background: var(--vc-sidebar-hover-bg); color: var(--vc-sidebar-text-strong); }
.ghost-btn--logout:hover { color: #fecaca; }

.topbar {
    display: none;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 0.9rem;
    background: var(--vc-sidebar-bg);
    color: var(--vc-sidebar-text-strong);
    position: sticky;
    top: 0;
    z-index: 30;
}
.icon-btn {
    background: transparent;
    border: none;
    color: inherit;
    font-size: 1.25rem;
    padding: 0.35rem 0.5rem;
    cursor: pointer;
    border-radius: 8px;
}
.icon-btn:hover { background: var(--vc-sidebar-hover-bg); }

.backdrop { display: none; }

.content { min-width: 0; }

@media (max-width: 900px) {
    .shell { grid-template-columns: 1fr; }
    .topbar { display: flex; }
    .ghost-btn--desktop-theme { display: none; }
    .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        width: var(--vc-sidebar-width);
        transform: translateX(-100%);
        transition: transform 0.25s ease;
        z-index: 40;
    }
    .shell--menu-open .sidebar { transform: translateX(0); box-shadow: var(--vc-shadow-lg); }
    .shell--menu-open .backdrop {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        z-index: 35;
    }
}
</style>

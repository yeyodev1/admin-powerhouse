import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
    meta: { title: 'Home' },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: 'Login' },
  },
  {
    path: '/admin',
    component: () => import('../views/AdminView.vue'),
    // `roles` (plural): el módulo de estudios lo comparten administradores y
    // asesores. Las secciones exclusivas de admin lo declaran en su propia meta.
    meta: { title: 'Admin', requiresAuth: true, roles: ['admin', 'advisor'] },
    children: [
      {
        path: '',
        redirect: '/admin/studies'
      },
      {
        path: 'studies',
        name: 'AdminStudies',
        component: () => import('../components/admin/AdminStudies.vue'),
        meta: { title: 'Estudios' }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('../components/admin/AdminUsers.vue'),
        meta: { title: 'Usuarios', roles: ['admin'] }
      },
      {
        path: 'persons',
        name: 'AdminPersons',
        component: () => import('../components/admin/AdminPersons.vue'),
        meta: { title: 'Pacientes' }
      },
      {
        path: 'metrics',
        name: 'AdminMetrics',
        component: () => import('../components/admin/AgentMetrics.vue'),
        meta: { title: 'Agentes del CRM Bakano' }
      },
      {
        path: 'metrics/:id',
        name: 'AgentDetail',
        component: () => import('../components/admin/AgentDetailView.vue'),
        meta: { title: 'Detalle de Agente' }
      },
      {
        path: 'info',
        name: 'AdminInfo',
        component: () => import('../components/admin/AdminInfo.vue'),
        meta: { title: 'Notificaciones' }
      }
    ]
  },
  {
    path: '/user',
    name: 'UserDashboard',
    component: () => import('../views/UserDashboard.vue'),
    meta: { title: 'Mi Panel', requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { left: 0, top: 0, behavior: 'smooth' }
  },
})

/** Admins y asesores comparten el panel; el resto va a su dashboard */
const STAFF_ROLES = ['admin', 'advisor']

function homeFor(role: string | null) {
  return role && STAFF_ROLES.includes(role) ? '/admin' : '/user'
}

router.beforeEach((to, _from, next) => {
  const hasToken = !!localStorage.getItem('access_token')
  const userRole = localStorage.getItem('user_role')
  const requiresAuth = to.matched.some((record) => record.meta?.requiresAuth)

  // La coincidencia más profunda manda: un hijo puede restringir más que el padre
  const matchedRoles = to.matched
    .filter((record) => record.meta?.roles)
    .map((record) => record.meta.roles as string[])
  const requiredRoles = matchedRoles.length ? matchedRoles[matchedRoles.length - 1] : null

  if (requiresAuth && !hasToken) {
    return next({ path: '/login', replace: true })
  }

  if (requiredRoles && (!userRole || !requiredRoles.includes(userRole))) {
    return next({ path: homeFor(userRole), replace: true })
  }

  if (to.path === '/login' && hasToken) {
    return next({ path: homeFor(userRole), replace: true })
  }

  next()
})

export default router

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
    meta: { title: 'Admin', requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        redirect: '/admin/users'
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('../components/admin/AdminUsers.vue'),
        meta: { title: 'Usuarios' }
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
        meta: { title: 'Agentes GHL' }
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

router.beforeEach((to, _from, next) => {
  const hasToken = !!localStorage.getItem('access_token')
  const requiresAuth = to.matched.some((record) => record.meta?.requiresAuth)
  const requiredRole = to.matched.find((record) => record.meta?.role)?.meta?.role as string | undefined

  if (requiresAuth && !hasToken) {
    return next({ path: '/login', replace: true })
  }

  if (requiredRole) {
    const userRole = localStorage.getItem('user_role')
    if (userRole !== requiredRole) {
      return next({ path: userRole === 'admin' ? '/admin' : '/user', replace: true })
    }
  }

  if (to.path === '/login' && hasToken) {
    const role = localStorage.getItem('user_role')
    return next({ path: role === 'admin' ? '/admin' : '/user', replace: true })
  }

  next()
})

export default router

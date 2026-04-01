import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import RouteLoadError from '../views/RouteLoadError.vue'

/** Lazy route with cache + fallback, matching svelte-spa-router's wrap behavior. */
const loadView = (loader: () => Promise<unknown>) => {
  let cached: unknown = null
  return () => {
    if (cached) return Promise.resolve(cached)
    return loader()
      .then((mod) => {
        cached = mod
        return mod
      })
      .catch(() => ({ default: RouteLoadError }))
  }
}

const LoginPage = loadView(() => import('../views/LoginPage.vue'))
const ProfilePage = loadView(() => import('../views/ProfilePage.vue'))
const NotebooksPage = loadView(() => import('../views/NotebooksPage.vue'))
const NotebookPage = loadView(() => import('../views/NotebookPage.vue'))
const NotePage = loadView(() => import('../views/NotePage.vue'))
const NotFoundPage = loadView(() => import('../views/NotFoundPage.vue'))

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginPage
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfilePage,
      meta: { requiresAuth: true }
    },
    {
      path: '/notebooks',
      name: 'notebooks',
      component: NotebooksPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/notebook/:notebookId',
      name: 'notebook',
      component: NotebookPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/notebook/:notebookId/:noteId',
      name: 'note',
      component: NotePage,
      meta: { requiresAuth: true }
    },
    {
      path: '/',
      name: 'home',
      redirect: { name: 'notebooks' }
    },
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFoundPage }
  ]
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth) {
    await authStore.getAuth()
    if (!authStore.authGuardVerify()) {
      return {
        path: '/login',
        query: { redirect: to.fullPath }
      }
    }
  }
})

export default router

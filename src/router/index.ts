import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const LoginPage = () => import('../views/LoginPage.vue')
const ProfilePage = () => import('../views/ProfilePage.vue')
const NotebooksPage = () => import('../views/NotebooksPage.vue')
const NotebookPage = () => import('../views/NotebookPage.vue')
const NotePage = () => import('../views/NotePage.vue')
const NotFoundPage = () => import('../views/NotFoundPage.vue')

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

router.beforeEach((to) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.authGuardVerify()) {
    // this route requires auth, check if logged in
    // if not, redirect to login page.
    return {
      path: '/login',
      // save the location we were at to come back later
      query: { redirect: to.fullPath }
    }
  }
})

export default router

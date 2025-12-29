import {createWebHistory} from 'vue-router'
import {createRouter} from 'vue-router'
import HomePage from '@/components/HomePage.vue'
import EmotionPage from '@/components/EmotionPage.vue'
// import RegistPage from '@/components/RegistPage.vue'
// import LoginPage from '@/components/LoginPage.vue'
// import ContactUs from '@/components/ContactUs.vue'
// import Overview from '@/components/Overview.vue'

const routes = [
  // {
  //   path: '/',
  //   name: 'Register',
  //   component: RegistPage,
  // },
  {
    path: '/',
    name: 'Login',
    component: HomePage,
  },
  {
    path: '/Emotion',
    name: 'Detector',
    component: EmotionPage,
  }
]
  
const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
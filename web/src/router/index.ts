/**
 * router/index.ts
 *
 * Manual routes for ./src/pages/*.vue
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router'
//import Index from '@/pages/index.vue'
import PersonSection from '@/pages/person/PersonSection.vue'
import PersonPersonal from '@/pages/person/PersonPersonal.vue'
import PersonProfessional from '@/pages/person/PersonProfessional.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
        path: '/',
        redirect: '/person/personal'
    },
    {
      path: '/person',
      component: PersonSection,
      children: [
        {
            path: 'personal',
            meta: { title: 'Edit your personal information' },
            components: {
                default: PersonPersonal,
                //help: PersonalTabHelp
            }
        },
        {
            path: 'professional',
            meta: { title: 'Edit your professional information' },
            components: {
                default: PersonProfessional,
                //help: ProfessionalTabHelp
            }
        },
        {
            path: 'professional',
            meta: { title: 'Edit your professional information' },
            components: {
                default: PersonProfessional,
                //help: ProfessionalTabHelp
            }
        },
        { path: '', redirect: '/person/personal' }
      ]
    },
  ],
})

export default router

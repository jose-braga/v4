/**
 * router/index.ts
 *
 * Manual routes for ./src/pages/*.vue
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router'
//import Index from '@/pages/index.vue'
import PersonSection from '@/pages/person/PersonSection.vue'
import PersonPersonal from '@/pages/person/personal/PersonPersonal.vue'
import PersonProfessional from '@/pages/person/professional/PersonProfessional.vue'
import PersonWarehouse from '@/pages/person/warehouse/PersonWarehouse.vue'
import PersonSpaces from '@/pages/person/spaces/PersonSpaces.vue'
import ResetPasswordView from '@/pages/person/ResetPasswordView.vue'
import ManagerSection from '@/pages/manager/ManagerSection.vue'
import ManagerMembers from '@/pages/manager/ManagerMembers.vue'


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
            path: 'professional-academic',
            meta: { title: 'Edit your professional and academic information' },
            components: {
                default: PersonProfessional,
                //help: ProfessionalTabHelp
            }
        },
        {
            path: 'institutional-scientific',
            meta: { title: 'Edit your institutional and scientific information' },
            components: {
                default: PersonProfessional,
                //help: ProfessionalTabHelp
            }
        },
        {
            path: 'warehouse',
            meta: { title: 'Warehouse', feature: 'warehouse' },
            components: {
                default: PersonWarehouse,
                //help: PersonalTabHelp
            }
        },
        {
            path: 'spaces',
            meta: { title: 'Spaces', feature: 'spaces' },
            components: {
                default: PersonSpaces,
                //help: PersonalTabHelp
            }
        },
        { path: '', redirect: '/person/personal' }
      ]
    },
    {
      path: '/manager',
      component: ManagerSection,
      children: [
        {
            path: 'units/:unitSlug',
            meta: { title: 'Current members' },
            components: {
                default: ManagerMembers,
                //help: PersonalTabHelp
            }
        },
      ]
    },
    {
        path: '/reset-password',
        name: 'reset-password',
        component: ResetPasswordView,
        meta: { title: 'Reset Password', public: true, standalone: true },
    },
  ],
})

export default router

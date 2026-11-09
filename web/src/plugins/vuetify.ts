/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Composables
import { createVuetify } from 'vuetify'
// Styles
import '@mdi/font/css/materialdesignicons.css'

import 'vuetify/styles'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
        light: {
            dark: false,
            colors: {
                background: '#F9F9F9',
                surface: '#FFFFFF',
                primary: '#1A6E9C',
                secondary: '#3B4752',
                success: '#2A8450',
                error: '#C0392B',
                warning: '#946313',
                info: '#1A6E9C',
            },
            variables: {
                'border-color': '#1F2933',
                'border-opacity': 0.12,
                'high-emphasis-opacity': 0.92,     // text colour at full strength
                'medium-emphasis-opacity': 0.68,   // labels and hints land near #5F6B76
            },
        },
    },
  },
  defaults: {
       VCard:           { variant: 'flat', border: true },
       VExpansionPanel: { elevation: 0, border: true },
       VTextField:      { variant: 'outlined', density: 'comfortable' },
       VSelect:         { variant: 'outlined', density: 'comfortable' },
       VAutocomplete:   { variant: 'outlined', density: 'comfortable' },
       VTextarea:       { variant: 'outlined', density: 'comfortable' },
       VDateInput:      { variant: 'outlined', density: 'comfortable' },
       VFileInput:      { variant: 'outlined', density: 'comfortable' },
       VTabs:           { bgColor: '#FFFFFF', density: 'comfortable' },
     },
})

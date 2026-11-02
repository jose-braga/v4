<template>
    <v-form @submit.prevent="() => onSubmit()">
        <p v-if="fields.length === 0" class="text-medium-emphasis mb-4">
            No contacts yet. Use the button below to add one.
        </p>

        <!-- Attach v-for directly to v-row -->
        <template v-for="(field, i) in fields" :key="field.key">
            <v-row dense align="start">
                <v-col cols="12" md="5">
                    <v-text-field
                        v-model="field.value.name"
                        label="Contact name"
                        counter="100"
                        :error-messages="errAt(`contacts[${i}].name`)"
                    />
                </v-col>
                <v-col cols="12" md="5">
                    <v-text-field
                        v-model="field.value.phone"
                        label="Phone"
                        counter="20"
                        :error-messages="errAt(`contacts[${i}].phone`)"
                    />
                </v-col>
                <v-col cols="2" md="2" class="d-flex justify-center pt-3">
                    <v-btn
                        icon="mdi-delete" variant="text" color="error"
                        aria-label="Remove this contact"
                        @click="remove(i)"
                    />
                </v-col>
                <!-- Move divider inside or below -->
                <v-col cols="12" v-if="i < fields.length - 1">
                    <v-divider class="mb-4" />
                </v-col>
            </v-row>
        </template>
        <div class="d-flex justify-space-between align-center mt-4">
            <v-btn variant="outlined" prepend-icon="mdi-plus" @click="addRow">
                Add a contact
            </v-btn>
        </div>
        <v-row class="mt-6">
            <v-col cols="12" md="10">
                <v-alert v-if="error" type="error" density="compact" class="mb-4">
                    {{ error }}
                </v-alert>
                <v-alert v-if="success" type="success" density="compact" class="mb-4">
                    {{ success }}
                </v-alert>
            </v-col>
            <v-col cols="12" md="2" class="d-flex justify-end">
                <v-btn type="submit" color="primary"
                    :loading="submitting"
                    :disabled="!meta.dirty">Update
                </v-btn>
            </v-col>
        </v-row>
    </v-form>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useFieldArray, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

// ---- Payload ---------------------------------------------------------------
export interface EmergencyContact {
    id?: number                    // present for saved rows, absent for rows added in the UI
    name: string
    phone: string
}

export interface EmergencyContactsPayload {
    contacts: EmergencyContact[]
}

const props = withDefaults(defineProps<{
    initialValues?: EmergencyContactsPayload
    error?: string
    success?: string
}>(), {
    error: '',
    success: '',
})

const emit = defineEmits<{
    submit: [payload: EmergencyContactsPayload]
}>()


// ---- Form-side type --------------------------------------------------------
interface EmergencyContactsForm {
    id?: number
    name: string | null     // null in a freshly added row
    phone: string | null     // null in a freshly added row
}

// ---- Schema ----------------------------------------------------------------

const rowSchema = z.object({
    id: z.number().optional(),
    name: z.string().trim().min(1, 'Name is required').max(100, 'At most 100 characters'),
    phone: z.string().trim().min(1, 'Phone is required').max(20, 'At most 20 characters'),
})

const schema = z.object({ contacts: z.array(rowSchema) })

// ---- Conversions -----------------------------------------------------------
function toFormValues(p?: EmergencyContactsPayload): { contacts: EmergencyContactsForm[] } {
    return {
        contacts: (p?.contacts ?? []).map((u) => ({
            id: u.id,
            name: u.name ?? '',
            phone: u.phone ?? '',
        })),
    }
}
// freshly added rows hold nulls the schema would reject: cast once, validation covers it
const asFormValues = (p?: EmergencyContactsPayload) => toFormValues(p) as unknown as z.input<typeof schema>

// ---- Form ------------------------------------------------------------------
const { handleSubmit, isSubmitting, errors, meta, resetForm } = useForm({
    validationSchema: toTypedSchema(schema),
    initialValues: asFormValues(props.initialValues),
})

const { fields, push, remove, replace } = useFieldArray<EmergencyContactsForm>('contacts')

const submitting = computed(() => isSubmitting.value)

function errAt(path: string) {
    const msg = (errors.value as Record<string, string | undefined>)[path]
    return msg ? [msg] : []
}

function addRow() {
    push({  name: '', phone: '' })
}

// After a successful save the parent hands us the saved data (new rows now
// have ids): reset so the form is "clean" again and Update goes back to disabled.
watch(
    () => props.initialValues,
    (v) => {
        resetForm({ values: asFormValues(v) })
        replace(toFormValues(v).contacts)
    },
)

const onSubmit = handleSubmit((values) => {
    emit('submit', {
        contacts: values.contacts.map((u) => ({
            ...(u.id !== undefined ? { id: u.id } : {}),
            name: u.name.trim(),
            phone: u.phone.trim(),
        })),
    })
})
</script>
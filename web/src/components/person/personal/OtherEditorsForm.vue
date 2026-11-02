<template>
    <v-form @submit.prevent="() => onSubmit()">
        <p v-if="fields.length === 0" class="text-medium-emphasis mb-4">
            Allow other people to edit your profile. Use the button below to add one.
        </p>

        <!-- Attach v-for directly to v-row -->
        <template v-for="(field, i) in fields" :key="field.key">
            <v-row dense align="start">
                <v-col cols="10" md="10">
                    <v-autocomplete v-model="field.value.user_id"
                        :items="userItems" item-title="name" item-value="user_id" label="User"
                        :error-messages="errAt(`editors[${i}].user_id`)" />
                </v-col>
                <v-col cols="2" md="2" class="d-flex justify-center pt-3">
                    <v-btn
                        icon="mdi-delete" variant="text" color="error"
                        aria-label="Remove this editor"
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
                Add an editor
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
import { useLookup } from '@/composables/useLookup'

// ---- Payload ---------------------------------------------------------------
export interface OtherEditor {
    id?: number                    // present for saved rows, absent for rows added in the UI
    user_id: number | null
}

export interface OtherEditorsPayload {
    editors: OtherEditor[]
}

const props = withDefaults(defineProps<{
    initialValues?: OtherEditorsPayload
    error?: string
    success?: string
}>(), {
    error: '',
    success: '',
})

const emit = defineEmits<{
    submit: [payload: OtherEditorsPayload]
}>()

// ---- Lookups ---------------------------------------------------------------
const { items: userItems } = useLookup('users')

// ---- Form-side type --------------------------------------------------------
interface OtherEditorsForm {
    id?: number
    user_id: number | null
}

// ---- Schema ----------------------------------------------------------------

const rowSchema = z.object({
    id: z.number().optional(),
    user_id: z.number().min(1, 'User is required'),
})

const schema = z.object({ editors: z.array(rowSchema) })

// ---- Conversions -----------------------------------------------------------
function toFormValues(p?: OtherEditorsPayload): { editors: OtherEditorsForm[] } {
    return {
        editors: (p?.editors ?? []).map((u) => ({
            id: u.id,
            user_id: u.user_id,
        })),
    }
}
// freshly added rows hold nulls the schema would reject: cast once, validation covers it
const asFormValues = (p?: OtherEditorsPayload) => toFormValues(p) as unknown as z.input<typeof schema>

// ---- Form ------------------------------------------------------------------
const { handleSubmit, isSubmitting, errors, meta, resetForm } = useForm({
    validationSchema: toTypedSchema(schema),
    initialValues: asFormValues(props.initialValues),
})

const { fields, push, remove, replace } = useFieldArray<OtherEditorsForm>('editors')

const submitting = computed(() => isSubmitting.value)

function errAt(path: string) {
    const msg = (errors.value as Record<string, string | undefined>)[path]
    return msg ? [msg] : []
}

function addRow() {
    push({  user_id: null })
}

// After a successful save the parent hands us the saved data (new rows now
// have ids): reset so the form is "clean" again and Update goes back to disabled.
watch(
    () => props.initialValues,
    (v) => {
        resetForm({ values: asFormValues(v) })
        replace(toFormValues(v).editors)
    },
)

const onSubmit = handleSubmit((values) => {
    emit('submit', {
        editors: values.editors.map((u) => ({
            ...(u.id !== undefined ? { id: u.id } : {}),
            user_id: u.user_id,
        })),
    })
})
</script>
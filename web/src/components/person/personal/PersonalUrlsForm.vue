<template>
    <v-form @submit.prevent="() => onSubmit()">
        <p v-if="fields.length === 0" class="text-medium-emphasis mb-4">
            No URL yet. Use the button below to add one.
        </p>

        <!-- Attach v-for directly to v-row -->
        <template v-for="(field, i) in fields" :key="field.key">
            <v-row dense align="start">
                <v-col cols="12" md="5">
                    <v-select
                        v-model="field.value.url_type_id"
                        :items="urlTypes" item-title="name" item-value="id"
                        label="Type"
                        :loading="urlTypesLoading"
                        :error-messages="errAt(`urls[${i}].url_type_id`)"
                    />
                </v-col>
                <v-col cols="12" md="7">
                    <v-text-field
                        v-model="field.value.description"
                        label="Description"
                        counter="200"
                        :error-messages="errAt(`urls[${i}].description`)"
                    />
                </v-col>
                <v-col cols="10" md="11">
                    <v-text-field
                        v-model="field.value.url"
                        label="URL"
                        type="url"
                        counter="200"
                        :placeholder="placeholder"
                        :error-messages="errAt(`urls[${i}].url`)"
                    />
                </v-col>
                <v-col cols="2" md="1" class="d-flex justify-center pt-3">
                    <v-btn
                        icon="mdi-delete" variant="text" color="error"
                        aria-label="Remove this URL"
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
                Add a URL
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
export interface PersonalUrl {
    id?: number                    // present for saved rows, absent for rows added in the UI
    url_type_id: number
    url: string
    description: string | null
}

export interface PersonalUrlsPayload {
    urls: PersonalUrl[]
}

const props = withDefaults(defineProps<{
    initialValues?: PersonalUrlsPayload
    error?: string
    success?: string
}>(), {
    error: '',
    success: '',
})

const placeholder = "https://"

const emit = defineEmits<{
    submit: [payload: PersonalUrlsPayload]
}>()

// ---- Lookups ---------------------------------------------------------------
const { items: urlTypes, loading: urlTypesLoading } = useLookup('url-types')

// ---- Form-side type --------------------------------------------------------
interface UrlForm {
    id?: number
    url_type_id: number | null     // null in a freshly added row
    url: string
    description: string            // '' instead of null, so the text field is always a string
}

// ---- Schema ----------------------------------------------------------------
// z.string().url() also accepts things like "javascript:alert(1)". Since these
// URLs become links for other users, only http(s) is allowed.
const isHttp = (s: string) => {
    try {
        const { protocol } = new URL(s)
        return protocol === 'http:' || protocol === 'https:'
    } catch {
        return false
    }
}

const rowSchema = z.object({
    id: z.number().optional(),
    url_type_id: z.number({
        required_error: 'Select a type',
        invalid_type_error: 'Select a type',
    }),
    description: z.string().trim().max(200, 'At most 200 characters'),
    url: z.string().trim()
        .min(1, 'URL is required')
        .max(2048, 'At most 2048 characters')
        .refine(isHttp, 'Enter a valid URL starting with http:// or https://'),
})

const schema = z.object({ urls: z.array(rowSchema) })

// ---- Conversions -----------------------------------------------------------
function toFormValues(p?: PersonalUrlsPayload): { urls: UrlForm[] } {
    return {
        urls: (p?.urls ?? []).map((u) => ({
            id: u.id,
            url_type_id: u.url_type_id,
            url: u.url,
            description: u.description ?? '',
        })),
    }
}
// freshly added rows hold nulls the schema would reject: cast once, validation covers it
const asFormValues = (p?: PersonalUrlsPayload) => toFormValues(p) as unknown as z.input<typeof schema>

const txt = (s: string) => s.trim() || null     // '' -> null

// ---- Form ------------------------------------------------------------------
const { handleSubmit, isSubmitting, errors, meta, resetForm } = useForm({
    validationSchema: toTypedSchema(schema),
    initialValues: asFormValues(props.initialValues),
})

const { fields, push, remove, replace } = useFieldArray<UrlForm>('urls')

const submitting = computed(() => isSubmitting.value)

function errAt(path: string) {
    const msg = (errors.value as Record<string, string | undefined>)[path]
    return msg ? [msg] : []
}

function addRow() {
    push({ url_type_id: null, url: '', description: '' })
}

// After a successful save the parent hands us the saved data (new rows now
// have ids): reset so the form is "clean" again and Update goes back to disabled.
watch(
    () => props.initialValues,
    (v) => {
        resetForm({ values: asFormValues(v) })
        replace(toFormValues(v).urls)
    },
)

const onSubmit = handleSubmit((values) => {
    emit('submit', {
        urls: values.urls.map((u) => ({
            ...(u.id !== undefined ? { id: u.id } : {}),
            url_type_id: u.url_type_id,
            url: u.url.trim(),
            description: txt(u.description),
        })),
    })
})
</script>
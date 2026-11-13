<template>
    <v-form @submit.prevent="() => onSubmit()">
        <p class="text-body-2 text-medium-emphasis mb-4">
            Write your name exactly as it appears in the author lists of your publications, for example
            "Braga, J" or "José Braga". Add one entry for each variant you use.
            Please list all variants of names used in publications,
            as this will help in matching publications to their respective authors.
        </p>

        <p v-if="fields.length === 0" class="text-medium-emphasis mb-4">
            No author names yet. Use the button below to add one.
        </p>

        <v-row >
            <v-col cols="10" md="4" lg="3" xl="2" v-for="(field, i) in fields" :key="field.key">
                <v-row dense align="start">
                    <v-col cols="10">
                        <v-text-field
                            v-model="field.value.name"
                            :label="`Author name ${i + 1}`"
                            counter="150"
                            :error-messages="fieldErrors(i, 'name')"
                        />
                    </v-col>
                    <v-col cols="2">
                        <v-tooltip text="Remove this name" location="top">
                            <template #activator="{ props: tip }">
                                <v-btn
                                    v-bind="tip"
                                    icon="mdi-delete"
                                    color="error"
                                    variant="text"
                                    aria-label="Remove this name"
                                    @click="remove(i)"
                                />
                            </template>
                        </v-tooltip>
                    </v-col>
                </v-row>
            </v-col>
            <v-col cols="2" md="2" lg="2">
                <v-tooltip text="Add author name" location="top">
                    <template #activator="{ props: tip }">
                        <v-btn v-bind="tip" icon="mdi-plus" @click="addRow"></v-btn>
                    </template>
                </v-tooltip>



            </v-col>
        </v-row>



        <v-row class="mt-2">
            <v-col cols="12" md="10">
                <v-alert v-if="error" type="error" density="compact" class="mb-4">{{ error }}</v-alert>
                <v-alert v-if="success" type="success" density="compact" class="mb-4">{{ success }}</v-alert>
            </v-col>
            <v-col cols="12" md="2" class="d-flex justify-end">
                <v-btn type="submit" color="primary" :loading="submitting" :disabled="!meta.dirty">
                    Update
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
export interface AuthorName {
    id?: number                // present for saved rows, absent for rows added in the UI
    name: string
}

export interface AuthorNamesPayload {
    author_names: AuthorName[]
}

const props = withDefaults(defineProps<{
    initialValues?: AuthorNamesPayload
    error?: string
    success?: string
}>(), {
    error: '',
    success: '',
})

const emit = defineEmits<{
    submit: [payload: AuthorNamesPayload]
}>()

// ---- Schema ----------------------------------------------------------------
const rowSchema = z.object({
    id: z.number().optional(),
    name: z.string().trim()
        .min(1, 'Enter a name')
        .max(150, 'At most 150 characters long'),
})

const authorNamesSchema = z.object({
    author_names: z.array(rowSchema).superRefine((rows, ctx) => {
        const seen = new Set<string>()
        rows.forEach((r, i) => {
            const key = r.name.toLowerCase()
            if (key && seen.has(key)) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'This name is already in the list', path: [i, 'name'] })
            }
            seen.add(key)
        })
    }),
})

// ---- Conversions -----------------------------------------------------------
function toFormValues(p?: AuthorNamesPayload) {
    return {
        author_names: (p?.author_names ?? []).map((a) => ({ id: a.id, name: a.name })),
    }
}

// ---- Form ------------------------------------------------------------------
const { handleSubmit, isSubmitting, errors, meta, resetForm } = useForm({
    validationSchema: toTypedSchema(authorNamesSchema),
    initialValues: toFormValues(props.initialValues),
})

const { fields, push, remove, replace } = useFieldArray<{
    id?: number
    name: string
}>('author_names')

function addRow() {
    push({ name: '' })
}

function fieldErrors(index: number, name: string) {
    const msg = errors.value[`author_names[${index}].${name}` as keyof typeof errors.value]
    return msg ? [msg] : []
}

const submitting = computed(() => isSubmitting.value)

// After a successful save the parent hands us the saved data (new rows now
// have ids): reset so the form is "clean" again and Update goes back to disabled.
watch(
    () => props.initialValues,
    (v) => {
        resetForm({ values: toFormValues(v) })
        replace(toFormValues(v).author_names)
    },
)

const onSubmit = handleSubmit((values) => {
    emit('submit', {
        author_names: values.author_names.map((a) => ({
            ...(a.id !== undefined ? { id: a.id } : {}),
            name: a.name,
        })),
    })
})
</script>
<template>
    <v-form @submit.prevent="() => onSubmit()">
        <v-textarea
            v-model="shortCv"
            label="Short CV text"
            outlined
            :error-messages="shortCvErrors"
        ></v-textarea >
        <v-row>
            <v-col cols="12" md="10">
                <v-alert v-if="error" type="error" density="compact" class="mb-4">
                    {{ error }}
                </v-alert>
                <v-alert v-if="success" type="success" density="compact" class="mb-4">
                    {{ success }}
                </v-alert>
            </v-col>
            <v-col cols="12" md="2" class="d-flex justify-end">
                <v-btn
                    type="submit"
                    color="primary"
                    :loading="submitting"
                >
                    Update
                </v-btn>
            </v-col>
        </v-row>
    </v-form>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

export interface ShortCvPayload {
    shortCv: string | null
}

const emit = defineEmits<{
    submit: [payload: ShortCvPayload]
}>()


const props = withDefaults(defineProps<{
    initialValues?: ShortCvPayload
    error?: string
    success?: string
}>(), {
    error: '',
    success: '',
})

const shortCvSchema = z
    .object({
        shortCv: z.string().max(2000,'At most 2000 characters'),
    })

const { handleSubmit, isSubmitting } = useForm({
    validationSchema: toTypedSchema(shortCvSchema),
    initialValues: {
        shortCv: props.initialValues?.shortCv ?? '',
    },
})

const { value: shortCv, errorMessage: shortCvError } = useField<string>('shortCv')

const shortCvErrors = computed(() => (shortCvError.value ? [shortCvError.value] : []))

const submitting = computed(() => isSubmitting.value)

const onSubmit = handleSubmit((values) => {
    emit('submit', {
        ...values,
    } as ShortCvPayload)
})

</script>
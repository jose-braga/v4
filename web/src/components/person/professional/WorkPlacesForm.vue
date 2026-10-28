<template>
    <v-form @submit.prevent="() => onSubmit()">
        <v-text-field
            v-model="workplace"
            label="Workplace"
            outlined
            :error-messages="workplaceErrors"
        ></v-text-field>
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

export interface WorkplacePayload {
    workplace: string | null
}

const emit = defineEmits<{
    submit: [payload: WorkplacePayload]
}>()


const props = withDefaults(defineProps<{
    initialValues?: WorkplacePayload
    error?: string
    success?: string
}>(), {
    error: '',
    success: '',
})

const workplaceSchema = z
    .object({
        workplace: z.string().max(200,'At most 200 characters'),
    })

const { handleSubmit, isSubmitting } = useForm({
    validationSchema: toTypedSchema(workplaceSchema),
    initialValues: {
        workplace: props.initialValues?.workplace ?? '',
    },
})

const { value: workplace, errorMessage: workplaceError } = useField<string>('workplace')

const workplaceErrors = computed(() => (workplaceError.value ? [workplaceError.value] : []))

const submitting = computed(() => isSubmitting.value)

const onSubmit = handleSubmit((values) => {
    emit('submit', {
        ...values,
    } as WorkplacePayload)
})

</script>
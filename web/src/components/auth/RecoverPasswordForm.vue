<template>
    <div v-if="success">
        <v-alert type="success" density="comfortable" class="mb-4">
            {{ success }}
        </v-alert>
        <v-container>
            <v-row>
                <v-col cols="12" class="text-center">
                    <v-btn variant="text" @click="emit('cancel')">
                        {{ cancelLabel }}
                    </v-btn>
                </v-col>
            </v-row>
        </v-container>
    </div>

    <v-form v-else @submit.prevent="() => onSubmit()">
        <v-text-field
            v-model="emailOrUsername"
            label="Email or Username"
            outlined
            :error-messages="emailOrUsernameErrors"
        ></v-text-field>

        <v-alert v-if="error" type="error" density="compact" class="mb-4">
            {{ error }}
        </v-alert>

        <v-container>
            <v-row>
                <v-col cols="12">
                    <v-btn
                        type="submit"
                        color="red"
                        size="large"
                        class="text-title-large"
                        block
                        :loading="submitting"
                    >
                        Recover Password
                    </v-btn>
                </v-col>
            </v-row>
            <v-row>
                <v-col cols="12" class="text-center">
                    <v-btn variant="text" @click="emit('cancel')">
                        {{ cancelLabel }}
                    </v-btn>
                </v-col>
            </v-row>
        </v-container>
    </v-form>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

const props = withDefaults(defineProps<{
    cancelLabel?: string
    error?: string
    success?: string
}>(), {
    cancelLabel: 'Back to Login',
    error: '',
    success: '',
})

const emit = defineEmits<{
    submit: [payload: { emailOrUsername: string }]
    cancel: []
}>()

const recoverSchema = z.object({
    emailOrUsername: z.string().min(1, 'Email or username is required'),
})

const { handleSubmit, isSubmitting } = useForm({
    validationSchema: toTypedSchema(recoverSchema),
})

const { value: emailOrUsername, errorMessage: emailOrUsernameError } = useField<string>('emailOrUsername')

const emailOrUsernameErrors = computed(() => (emailOrUsernameError.value ? [emailOrUsernameError.value] : []))
const submitting = computed(() => isSubmitting.value)

const onSubmit = handleSubmit((values) => {
    emit('submit', values)
})
</script>

<style scoped>
</style>
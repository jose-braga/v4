const EXTERNAL_API_BASE = process.env.EXTERNAL_API_BASE_URL ?? 'https://ucibio.pt/api'

// Status codes where retrying makes sense (temporary issues)
const RETRYABLE_STATUSES = new Set([500, 5001, 1000])

const STATUS_MESSAGES = {
    200: 'Success',
    500: 'Internal Server Error',
    5001: 'External Server Error',
    1000: 'Error while fetching web service',
    1001: 'This element already exists. Please delete it before',
    1002: 'Unable to update the content',
    1003: 'This element already exists. Please delete it before',
    1004: 'This content does not exist',
    1005: 'Content to be created does not exist in the platform',
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Sends a GET notification to the external API with built-in retries.
 *
 * @param {'create' | 'update' | 'delete'} action
 * @param {'laboratories' | 'group' | 'people' | 'publications'} element
 * @param {string | number} id
 * @param {object} [options]
 * @param {number} [options.maxRetries=3] - Maximum retry attempts
 * @param {number} [options.initialDelayMs=1000] - Initial delay before retry (1s)
 */
export async function notifyExternalApi(action, element, id, options = {}) {
    const { maxRetries = 3, initialDelayMs = 1000 } = options
    const url = `${EXTERNAL_API_BASE}/${action}/${element}/${id}`

    let attempt = 0
    let currentDelay = initialDelayMs

    while (attempt <= maxRetries) {
        attempt++
        try {
            // Notifications are GET requests
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            })

            let statusCode = response.status
            let responseMessage = ''

            // Try parsing JSON payload (e.g., {"statusCode":1003,"response":"..."})
            try {
                const data = await response.json()
                if (data.statusCode) statusCode = data.statusCode
                responseMessage = data.response ?? STATUS_MESSAGES[statusCode] ?? ''
            } catch {
                responseMessage = STATUS_MESSAGES[statusCode] ?? response.statusText
            }

            // 200 - OK
            if (statusCode === 200) {
                console.log(`[External Notifier] SUCCESS (Attempt ${attempt}): GET ${url}`)
                return { success: true, statusCode, message: responseMessage }
            }

            console.warn(
                `[External Notifier] Attempt ${attempt}/${maxRetries + 1} failed for GET ${url} - ` +
                `StatusCode: ${statusCode}, Message: "${responseMessage}"`
            )

            // If it's a non-retryable logical error (e.g., 1001, 1003, 1004), stop retrying
            if (!RETRYABLE_STATUSES.has(statusCode) && statusCode !== 200) {
                if (action === 'update' && (statusCode === 1004 || statusCode === 1005) ) {
                    console.warn(`[External Notifier] Logical error: Element does not exist.
                        Retry with create action for GET ${url}`)
                    action = 'create'
                    continue // Retry immediately with the new action
                }
                if (action === 'create' && (statusCode === 1001 || statusCode === 1003) ) {
                    console.warn(`[External Notifier] Logical error: Element already created.
                        Retry with update action for GET ${url}`)
                    action = 'update'
                    continue // Retry immediately with the new action
                }
                return { success: false, statusCode, message: responseMessage }
            }

        } catch (err) {
            console.error(`[External Notifier] Attempt ${attempt}/${maxRetries + 1} network error for GET ${url}:`, err.message)
        }

        // If we still have retries remaining, wait before trying again
        if (attempt <= maxRetries) {
            console.log(`[External Notifier] Waiting ${currentDelay}ms before retry...`)
            await sleep(currentDelay)
            currentDelay *= 2 // Exponential backoff (1s -> 2s -> 4s)
        }
    }

    console.error(`[External Notifier] GAVE UP after ${maxRetries + 1} attempts for GET ${url}`)
    return { success: false, statusCode: null, message: 'Max retries reached' }
}
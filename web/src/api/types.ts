export interface ApiError {
    status: number | null       // null = network error, no response received
    message: string
    fieldErrors?: Record<string, string[]>  // e.g. { username: ['already taken'] }
}
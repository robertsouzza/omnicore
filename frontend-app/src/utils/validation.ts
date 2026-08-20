import { ApiError } from '../api/client'

interface ValidationBody {
  message?: string
  fields?: Record<string, string>
}

export function getFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || typeof error.body !== 'object' || error.body === null) {
    return {}
  }

  const fields = (error.body as ValidationBody).fields
  return fields ?? {}
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}

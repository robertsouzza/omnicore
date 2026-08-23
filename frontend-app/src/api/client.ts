const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

function extractApiErrorMessage(body: unknown, status: number): string {
  if (typeof body === 'object' && body !== null) {
    const record = body as Record<string, unknown>
    if (typeof record.message === 'string' && record.message.trim()) {
      return record.message
    }
    if (typeof record.error === 'string' && record.error.trim()) {
      return record.error
    }
  }

  if (status === 409) {
    return 'Conflito ao salvar os dados. Verifique se o registro já existe.'
  }
  if (status >= 500) {
    return 'Erro interno do servidor. Tente novamente em instantes.'
  }

  return `Erro ${status}`
}

export class ApiError extends Error {
  status: number
  body?: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = undefined
    }

    const message = extractApiErrorMessage(body, response.status)

    throw new ApiError(message, response.status, body)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

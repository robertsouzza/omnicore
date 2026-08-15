import { apiFetch } from './client'
import type { LoginRequest, LoginResponse } from '../types/auth'

export function login(credentials: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

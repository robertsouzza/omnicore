import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '../api/client'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
            return false
          }
          return failureCount < 1
        },
      },
      mutations: {
        retry: false,
      },
    },
  })
}

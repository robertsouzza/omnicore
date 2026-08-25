import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { Page } from '../types/produto'
import { getErrorMessage } from '../utils/validation'
import { useUnauthorizedHandler } from './useUnauthorizedHandler'

export interface UsePaginatedResourceOptions {
  enabled?: boolean
  errorMessage?: string
  pageNumber?: number
  setPageNumber?: Dispatch<SetStateAction<number>>
}

/**
 * Carrega uma página de recursos com estados initialLoading/refreshing/loadError.
 * `fetchPage` deve ser memoizado (useCallback) com os filtros da listagem.
 */
export function usePaginatedResource<T>(
  fetchPage: ((page: number) => Promise<Page<T>>) | null,
  options: UsePaginatedResourceOptions = {},
) {
  const {
    enabled = true,
    errorMessage = 'Erro ao carregar dados.',
    pageNumber: controlledPageNumber,
    setPageNumber: controlledSetPageNumber,
  } = options

  const handleUnauthorized = useUnauthorizedHandler()
  const [internalPageNumber, setInternalPageNumber] = useState(0)
  const pageNumber = controlledPageNumber ?? internalPageNumber
  const setPageNumber = controlledSetPageNumber ?? setInternalPageNumber

  const [page, setPage] = useState<Page<T> | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const hasLoadedOnce = useRef(false)

  const resetPage = useCallback(() => {
    setPageNumber(0)
  }, [setPageNumber])

  const load = useCallback(async () => {
    if (!enabled || !fetchPage) return

    if (!hasLoadedOnce.current) {
      setInitialLoading(true)
    } else {
      setRefreshing(true)
    }
    setLoadError(null)

    try {
      const data = await fetchPage(pageNumber)
      setPage(data)
    } catch (err) {
      if (handleUnauthorized(err)) return
      setLoadError(getErrorMessage(err, errorMessage))
    } finally {
      hasLoadedOnce.current = true
      setInitialLoading(false)
      setRefreshing(false)
    }
  }, [enabled, fetchPage, pageNumber, handleUnauthorized, errorMessage])

  useEffect(() => {
    void load()
  }, [load])

  return {
    page,
    pageNumber,
    setPageNumber,
    resetPage,
    initialLoading,
    refreshing,
    loadError,
    setLoadError,
    load,
    listaPronta: page !== null && !initialLoading,
    handleUnauthorized,
  }
}

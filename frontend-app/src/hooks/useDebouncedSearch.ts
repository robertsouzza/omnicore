import { useEffect, useRef, useState } from 'react'

export interface UseDebouncedSearchOptions {
  /** Mínimo de caracteres para considerar busca no servidor (padrão 3). */
  minLength?: number
  /** Atraso em ms antes de aplicar o valor debounced (padrão 300). */
  delayMs?: number
  /** Normaliza o valor antes de medir tamanho e debounce (padrão trim). */
  normalize?: (value: string) => string
  /** Chamado quando o valor debounced muda (ex.: resetar paginação). */
  onDebouncedChange?: () => void
}

const defaultNormalize = (value: string) => value.trim()

/**
 * Valor de busca com debounce e flags para filtro local vs API.
 * Padrão usado em Produtos, Clientes, Estoque e Nova Venda.
 */
export function useDebouncedSearch(options: UseDebouncedSearchOptions = {}) {
  const {
    minLength = 3,
    delayMs = 300,
    normalize = defaultNormalize,
    onDebouncedChange,
  } = options

  const onDebouncedChangeRef = useRef(onDebouncedChange)
  onDebouncedChangeRef.current = onDebouncedChange

  const [value, setValue] = useState('')
  const [debouncedValue, setDebouncedValue] = useState('')

  const normalized = normalize(value)
  const isActive = normalized.length > 0
  const isShort = isActive && normalized.length < minLength
  const isServerSearch = debouncedValue.length >= minLength

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = normalize(value)
      setDebouncedValue(next.length >= minLength ? next : '')
      onDebouncedChangeRef.current?.()
    }, delayMs)

    return () => window.clearTimeout(timer)
  }, [value, minLength, delayMs, normalize])

  return {
    value,
    setValue,
    debouncedValue,
    normalized,
    isActive,
    isShort,
    isServerSearch,
  }
}

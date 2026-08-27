import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useDebouncedSearch } from './useDebouncedSearch'

describe('useDebouncedSearch', () => {
  it('inicia com valor vazio e sem busca ativa', () => {
    const { result } = renderHook(() => useDebouncedSearch())

    expect(result.current.value).toBe('')
    expect(result.current.isActive).toBe(false)
    expect(result.current.isServerSearch).toBe(false)
  })

  it('marca isShort antes do mínimo para API', () => {
    const { result } = renderHook(() => useDebouncedSearch({ minLength: 3 }))

    act(() => {
      result.current.setValue('ab')
    })

    expect(result.current.isActive).toBe(true)
    expect(result.current.isShort).toBe(true)
    expect(result.current.isServerSearch).toBe(false)
  })

  it('aplica debounce e dispara busca no servidor', () => {
    vi.useFakeTimers()
    const onDebouncedChange = vi.fn()
    const { result } = renderHook(() =>
      useDebouncedSearch({ minLength: 3, delayMs: 300, onDebouncedChange }),
    )

    act(() => {
      result.current.setValue('  fanta ')
    })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current.debouncedValue).toBe('fanta')
    expect(result.current.isServerSearch).toBe(true)
    expect(onDebouncedChange).toHaveBeenCalled()

    vi.useRealTimers()
  })
})

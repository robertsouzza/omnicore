import { useEffect, useState } from 'react'
import { buscarClientePorDocumento, listarClientes } from '../api/clientes'
import { useAuth } from '../auth/AuthContext'
import { useDebouncedSearch, useUnauthorizedHandler } from '../hooks'
import type { Cliente } from '../types/cliente'
import { TIPO_DOCUMENTO_PADRAO } from '../types/cliente'
import { isCpfValido } from '../utils/cpf'
import {
  normalizeNumeroDocumento,
  type TipoDocumento,
} from '../utils/documento'
import { getErrorMessage } from '../utils/validation'

const BUSCA_MIN_API = 3

export function useClienteBusca() {
  const { session } = useAuth()
  const handleUnauthorized = useUnauthorizedHandler()

  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [nomeOcasional, setNomeOcasional] = useState('')
  const clienteSearch = useDebouncedSearch({ minLength: BUSCA_MIN_API })
  const [clientesSugeridos, setClientesSugeridos] = useState<Cliente[]>([])
  const [tipoDocumentoBusca, setTipoDocumentoBusca] = useState<TipoDocumento>(TIPO_DOCUMENTO_PADRAO)
  const [documentoBusca, setDocumentoBusca] = useState('')
  const [clienteNotice, setClienteNotice] = useState<string | null>(null)
  const [buscandoDocumento, setBuscandoDocumento] = useState(false)

  useEffect(() => {
    if (!session || clienteSearch.debouncedValue.length < BUSCA_MIN_API) {
      setClientesSugeridos([])
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const data = await listarClientes(session.token, {
          page: 0,
          size: 8,
          nome: clienteSearch.debouncedValue,
        })
        if (!cancelled) setClientesSugeridos(data.content)
      } catch (err) {
        if (handleUnauthorized(err)) return
      }
    })()

    return () => {
      cancelled = true
    }
  }, [session, clienteSearch.debouncedValue, handleUnauthorized])

  function selecionarCliente(cliente: Cliente) {
    setClienteSelecionado(cliente)
    clienteSearch.setValue('')
    setClientesSugeridos([])
    setDocumentoBusca('')
    setClienteNotice(null)
    setNomeOcasional('')
  }

  function limparClienteSelecionado() {
    setClienteSelecionado(null)
  }

  async function handleBuscarDocumento() {
    if (!session) return

    const numero = normalizeNumeroDocumento(tipoDocumentoBusca, documentoBusca)

    if (tipoDocumentoBusca === 'CPF') {
      if (numero.length < 11) {
        setClienteNotice('Informe um CPF com 11 dígitos para buscar.')
        return
      }
      if (!isCpfValido(numero)) {
        setClienteNotice('Informe um CPF válido para buscar.')
        return
      }
    } else if (numero.length < 3) {
      setClienteNotice('Informe pelo menos 3 caracteres do documento para buscar.')
      return
    }

    setBuscandoDocumento(true)
    setClienteNotice(null)

    try {
      const cliente = await buscarClientePorDocumento(session.token, tipoDocumentoBusca, numero)
      selecionarCliente(cliente)
    } catch (err) {
      if (handleUnauthorized(err)) return
      setClienteNotice(getErrorMessage(err, 'Nenhum cliente encontrado para este documento.'))
    } finally {
      setBuscandoDocumento(false)
    }
  }

  function reset() {
    setClienteSelecionado(null)
    setNomeOcasional('')
    clienteSearch.setValue('')
    setClientesSugeridos([])
    setDocumentoBusca('')
    setTipoDocumentoBusca(TIPO_DOCUMENTO_PADRAO)
    setClienteNotice(null)
    setBuscandoDocumento(false)
  }

  return {
    clienteSelecionado,
    nomeOcasional,
    setNomeOcasional,
    clienteSearch,
    clientesSugeridos,
    tipoDocumentoBusca,
    setTipoDocumentoBusca,
    documentoBusca,
    setDocumentoBusca,
    clienteNotice,
    setClienteNotice,
    buscandoDocumento,
    selecionarCliente,
    limparClienteSelecionado,
    handleBuscarDocumento,
    reset,
  }
}

export type ClienteBusca = ReturnType<typeof useClienteBusca>

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { inativarProduto, listarProdutos } from '../api/produtos'
import { queryKeys, type ProdutosListFilters } from '../lib/queryKeys'
import { getErrorMessage } from '../utils/validation'

/** Mesmo intervalo de `useProdutoSaldos` — edição/inativação em um terminal reflete nos demais. */
export const PRODUTOS_LIST_REFETCH_MS = 4000

export function useProdutosListQuery(token: string | undefined, filters: ProdutosListFilters) {
  return useQuery({
    queryKey: queryKeys.produtos.list(filters),
    queryFn: () => {
      if (!token) throw new Error('Sem sessão')
      return listarProdutos(token, {
        page: filters.page,
        incluirInativos: filters.incluirInativos,
        nome: filters.nome,
        codigoBarras: filters.codigoBarras,
      })
    },
    enabled: Boolean(token),
    refetchInterval: PRODUTOS_LIST_REFETCH_MS,
    refetchIntervalInBackground: false,
  })
}

export function useInativarProdutoMutation(token: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (produtoId: number) => {
      if (!token) throw new Error('Sem sessão')
      return inativarProduto(token, produtoId)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.produtos.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.estoque.all })
    },
  })
}

export function getProdutosQueryErrorMessage(error: unknown): string {
  return getErrorMessage(error, 'Erro ao carregar produtos.')
}

export function getInativarProdutoErrorMessage(error: unknown): string {
  return getErrorMessage(error, 'Não foi possível inativar o produto.')
}

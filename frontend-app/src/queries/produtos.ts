import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { inativarProduto, listarProdutos } from '../api/produtos'
import { queryKeys, type ProdutosListFilters } from '../lib/queryKeys'
import { getErrorMessage } from '../utils/validation'

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

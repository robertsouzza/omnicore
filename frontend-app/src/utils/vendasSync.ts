const CHANNEL_NAME = 'omnicore-vendas-updated'

export type VendasUpdatedMessage = {
  vendaId: number
  origem?: 'pdv' | 'caixa' | 'nova-venda' | 'salao'
}

/** Avisa outras abas (ex.: /vendas) para recarregar a listagem. */
export function notificarVendasAtualizadas(message: VendasUpdatedMessage): void {
  if (typeof BroadcastChannel === 'undefined') return
  const channel = new BroadcastChannel(CHANNEL_NAME)
  channel.postMessage(message)
  channel.close()
}

export function escutarVendasAtualizadas(onUpdate: (message: VendasUpdatedMessage) => void): () => void {
  if (typeof BroadcastChannel === 'undefined') {
    return () => undefined
  }
  const channel = new BroadcastChannel(CHANNEL_NAME)
  channel.onmessage = (event: MessageEvent<VendasUpdatedMessage>) => {
    if (event.data?.vendaId != null) {
      onUpdate(event.data)
    }
  }
  return () => channel.close()
}

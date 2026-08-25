import { TIPOS_DOCUMENTO } from '../types/cliente'
import { formatDocumentoDisplay, maskDocumentoInput, type TipoDocumento } from '../utils/documento'
import type { ClienteBusca } from '../hooks/useClienteBusca'
import styles from './ClienteBuscaSection.module.css'

interface ClienteBuscaSectionProps {
  busca: ClienteBusca
  disabled?: boolean
}

export function ClienteBuscaSection({ busca, disabled = false }: ClienteBuscaSectionProps) {
  const {
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
  } = busca

  return (
    <>
      <label className={styles.field}>
        Buscar cliente por nome
        <input
          className={styles.input}
          value={clienteSearch.value}
          onChange={(e) => {
            clienteSearch.setValue(e.target.value)
            setClienteNotice(null)
          }}
          placeholder="Digite parte do nome (3+ letras)"
          disabled={disabled || Boolean(clienteSelecionado)}
          autoComplete="off"
        />
      </label>

      {clienteSelecionado ? (
        <div className={styles.selectedChip}>
          <span>
            {clienteSelecionado.nomeCompleto}
            {' · '}
            {formatDocumentoDisplay(
              clienteSelecionado.tipoDocumento,
              clienteSelecionado.numeroDocumento,
            )}
          </span>
          <button
            type="button"
            className={styles.chipRemove}
            onClick={limparClienteSelecionado}
            disabled={disabled}
            aria-label="Remover cliente selecionado"
          >
            ×
          </button>
        </div>
      ) : (
        <>
          {clientesSugeridos.length > 0 && (
            <ul className={styles.suggestions}>
              {clientesSugeridos.map((cliente) => (
                <li key={cliente.id}>
                  <button
                    type="button"
                    className={styles.suggestionBtn}
                    disabled={disabled}
                    onClick={() => selecionarCliente(cliente)}
                  >
                    <span>{cliente.nomeCompleto}</span>
                    <span className={styles.suggestionMeta}>
                      {formatDocumentoDisplay(cliente.tipoDocumento, cliente.numeroDocumento)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className={styles.documentoBusca}>
            <span className={styles.documentoLabel}>Ou buscar por documento</span>
            <div className={styles.documentoForm}>
              <label className={styles.documentoField}>
                Tipo
                <select
                  className={styles.selectSmall}
                  value={tipoDocumentoBusca}
                  onChange={(e) => {
                    setTipoDocumentoBusca(e.target.value as TipoDocumento)
                    setDocumentoBusca('')
                    setClienteNotice(null)
                  }}
                  disabled={disabled}
                >
                  {TIPOS_DOCUMENTO.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.documentoFieldGrow}>
                Documento
                <input
                  className={styles.input}
                  value={documentoBusca}
                  onChange={(e) => {
                    setDocumentoBusca(maskDocumentoInput(tipoDocumentoBusca, e.target.value))
                    setClienteNotice(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void handleBuscarDocumento()
                    }
                  }}
                  placeholder={
                    tipoDocumentoBusca === 'CPF' ? '000.000.000-00' : 'Número do documento'
                  }
                  inputMode={tipoDocumentoBusca === 'CPF' ? 'numeric' : 'text'}
                  maxLength={tipoDocumentoBusca === 'CPF' ? 14 : 30}
                  disabled={disabled}
                  autoComplete="off"
                />
              </label>
              <button
                type="button"
                className={styles.searchDocBtn}
                disabled={disabled || buscandoDocumento}
                onClick={() => void handleBuscarDocumento()}
              >
                {buscandoDocumento ? 'Buscando…' : 'Buscar'}
              </button>
            </div>
          </div>

          {clienteNotice && <p className={styles.notice}>{clienteNotice}</p>}
        </>
      )}

      {!clienteSelecionado && (
        <label className={styles.field}>
          Cliente ocasional <span className={styles.optional}>(opcional)</span>
          <input
            className={styles.input}
            value={nomeOcasional}
            onChange={(e) => setNomeOcasional(e.target.value)}
            placeholder="Nome rápido, sem cadastro"
            maxLength={100}
            disabled={disabled}
          />
        </label>
      )}
    </>
  )
}

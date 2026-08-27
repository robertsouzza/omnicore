import styles from './ui.module.css'
import { Button } from './Button'

interface PaginationBarProps {
  pageNumber: number
  totalPages: number
  totalElements: number
  itemLabel: { one: string; many: string }
  first: boolean
  last: boolean
  onPrevious: () => void
  onNext: () => void
}

export function PaginationBar({
  pageNumber,
  totalPages,
  totalElements,
  itemLabel,
  first,
  last,
  onPrevious,
  onNext,
}: PaginationBarProps) {
  const label = totalElements === 1 ? itemLabel.one : itemLabel.many

  return (
    <nav className={styles.pagination} aria-label="Paginação">
      {totalPages > 1 && (
        <Button variant="secondary" disabled={first} onClick={onPrevious}>
          Anterior
        </Button>
      )}
      <span className={styles.paginationInfo}>
        Página {pageNumber + 1} de {totalPages}
        {' · '}
        {totalElements} {label}
      </span>
      {totalPages > 1 && (
        <Button variant="secondary" disabled={last} onClick={onNext}>
          Próxima
        </Button>
      )}
    </nav>
  )
}

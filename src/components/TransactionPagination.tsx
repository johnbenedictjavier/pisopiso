import { ChevronLeft, ChevronRight } from 'lucide-react'

export const TRANSACTION_PAGE_SIZE = 10

interface TransactionPaginationProps {
  total: number
  page: number
  onPageChange: (page: number) => void
}

export default function TransactionPagination({ total, page, onPageChange }: TransactionPaginationProps) {
  const pageCount = Math.ceil(total / TRANSACTION_PAGE_SIZE)
  const currentPage = total === 0 ? 0 : page + 1
  const firstItem = total === 0 ? 0 : page * TRANSACTION_PAGE_SIZE + 1
  const lastItem = total === 0 ? 0 : Math.min((page + 1) * TRANSACTION_PAGE_SIZE, total)
  const canGoPrevious = total > 0 && page > 0
  const canGoNext = total > 0 && page < pageCount - 1

  return (
    <nav className="transaction-pagination" aria-label="Transaction history pagination">
      <span>{firstItem}-{lastItem} of {total}</span>
      <div className="transaction-pagination-controls">
        <button className="button button-quiet button-small" type="button" disabled={!canGoPrevious} onClick={() => onPageChange(page - 1)} aria-label="Previous page"><ChevronLeft size={14} /> Prev</button>
        <strong aria-label={`Page ${currentPage}`}>{currentPage}</strong>
        <button className="button button-quiet button-small" type="button" disabled={!canGoNext} onClick={() => onPageChange(page + 1)} aria-label="Next page">Next <ChevronRight size={14} /></button>
      </div>
    </nav>
  )
}

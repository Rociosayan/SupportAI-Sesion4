type InboxPaginationProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function InboxPagination({ page, totalPages, onPageChange }: InboxPaginationProps) {
  return (
    <div className="pagination">
      <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Anterior
      </button>
      <span>
        Página {page} de {totalPages}
      </span>
      <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Siguiente
      </button>
    </div>
  )
}

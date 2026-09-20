export function formatDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate.includes('T') ? isoDate : `${isoDate}T12:00:00`).toLocaleDateString(
    'es-ES',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  )
}

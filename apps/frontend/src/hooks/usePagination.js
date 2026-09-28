import { useCallback, useState } from 'react'

export function usePagination(initialPage = 1) {
  const [page, setPage] = useState(initialPage)

  const goToPage = useCallback((nextPage) => {
    setPage(Math.max(1, nextPage))
  }, [])

  const reset = useCallback(() => setPage(1), [])

  return { page, setPage: goToPage, reset }
}

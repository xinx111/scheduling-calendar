import { useState, useCallback } from 'react'
import * as memoStore from '../db/memoStore'

/**
 * 备忘录 Hook
 */
export function useMemos() {
  const [memos, setMemos] = useState([])
  const [loading, setLoading] = useState(false)

  const loadByDate = useCallback(async (date) => {
    setLoading(true)
    const data = await memoStore.getMemosByDate(date)
    setMemos(data)
    setLoading(false)
    return data
  }, [])

  const addMemo = useCallback(async (data) => {
    const memo = await memoStore.addMemo(data)
    if (data.date) {
      await loadByDate(data.date)
    }
    return memo
  }, [loadByDate])

  const updateMemo = useCallback(async (id, updates) => {
    const memo = await memoStore.updateMemo(id, updates)
    if (memo.date) {
      await loadByDate(memo.date)
    }
    return memo
  }, [loadByDate])

  const deleteMemo = useCallback(async (id, date) => {
    await memoStore.deleteMemo(id)
    if (date) {
      await loadByDate(date)
    }
  }, [loadByDate])

  const markDone = useCallback(async (id, date) => {
    await memoStore.markMemoDone(id)
    if (date) {
      await loadByDate(date)
    }
  }, [loadByDate])

  return {
    memos,
    loading,
    loadByDate,
    addMemo,
    updateMemo,
    deleteMemo,
    markDone,
  }
}

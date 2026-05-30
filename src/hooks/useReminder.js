import { useState, useCallback, useEffect, useRef } from 'react'
import * as memoStore from '../db/memoStore'

/**
 * 提醒 Hook
 * 检查即将到来的提醒并触发通知
 */
export function useReminder() {
  const [upcoming, setUpcoming] = useState([])
  const [pendingCount, setPendingCount] = useState(0)
  const intervalRef = useRef(null)

  const checkReminders = useCallback(async () => {
    const [pending, upcomingData] = await Promise.all([
      memoStore.getPendingReminders(),
      memoStore.getUpcomingReminders(),
    ])
    setPendingCount(pending.length)
    setUpcoming(upcomingData)
  }, [])

  // 定期检查提醒（每分钟），同时监听手动变更事件
  useEffect(() => {
    checkReminders()
    intervalRef.current = setInterval(checkReminders, 60000)

    const onMemoChanged = () => checkReminders()
    window.addEventListener('memo-changed', onMemoChanged)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      window.removeEventListener('memo-changed', onMemoChanged)
    }
  }, [checkReminders])

  /**
   * 触发浏览器通知
   */
  const showNotification = useCallback(async (memo) => {
    if (!('Notification' in window)) return

    if (Notification.permission === 'granted') {
      new Notification('排班提醒', {
        body: memo.content,
        icon: '/icon-192.png',
        tag: memo.id,
      })
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        new Notification('排班提醒', {
          body: memo.content,
          icon: '/icon-192.png',
          tag: memo.id,
        })
      }
    }
  }, [])

  /**
   * 请求通知权限
   */
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false

    const result = await Notification.requestPermission()
    return result === 'granted'
  }, [])

  return {
    upcoming,
    pendingCount,
    checkReminders,
    showNotification,
    requestPermission,
  }
}

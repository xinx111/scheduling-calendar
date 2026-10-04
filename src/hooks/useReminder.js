import { useState, useCallback, useEffect } from 'react'
import * as memoStore from '../db/memoStore'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { scheduleMemoNotification, ensureReminderChannel } from '../notifications'

const isNative = Capacitor.isNativePlatform()

export function useReminder() {
  const [upcoming, setUpcoming] = useState([])
  const [pendingCount, setPendingCount] = useState(0)

  const checkReminders = useCallback(async () => {
    const [pending, upcomingData] = await Promise.all([
      memoStore.getPendingReminders(),
      memoStore.getUpcomingReminders(),
    ])
    setPendingCount(pending.length)
    setUpcoming(upcomingData)

    if (isNative) {
      for (const memo of upcomingData) {
        await scheduleMemoNotification(memo)
      }
    }
  }, [])

  useEffect(() => {
    if (isNative) {
      ensureReminderChannel()
    }

    checkReminders()
    const intervalId = setInterval(checkReminders, 30000)

    const handler = () => checkReminders()
    window.addEventListener('memo-changed', handler)
    return () => {
      clearInterval(intervalId)
      window.removeEventListener('memo-changed', handler)
    }
  }, [checkReminders])

  const requestPermission = useCallback(async () => {
    if (isNative) {
      try {
        const perm = await LocalNotifications.requestPermissions()
        return perm.display === 'granted'
      } catch { return false }
    }
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
    requestPermission,
    scheduleForMemo: scheduleMemoNotification,
  }
}

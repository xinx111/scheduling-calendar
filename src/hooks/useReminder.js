import { useState, useCallback, useEffect, useRef } from 'react'
import * as memoStore from '../db/memoStore'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

const isNative = Capacitor.isNativePlatform()

function hashId(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0
  return Math.abs(hash) % 1000000
}

export function useReminder() {
  const [upcoming, setUpcoming] = useState([])
  const [pendingCount, setPendingCount] = useState(0)
  const intervalRef = useRef(null)
  const scheduledRef = useRef(new Set())

  const scheduleOne = useCallback(async (memo) => {
    if (!memo.remindAt || scheduledRef.current.has(memo.id)) return
    try {
      const remindTime = new Date(memo.remindAt)
      if (remindTime <= new Date()) return

      await LocalNotifications.schedule({
        notifications: [{
          id: hashId(memo.id),
          title: '排班提醒',
          body: memo.content,
          schedule: { at: remindTime },
          channelId: 'scheduling-reminders',
          smallIcon: 'ic_stat_notification',
          extra: { memoId: memo.id },
        }],
      })
      scheduledRef.current.add(memo.id)
    } catch (e) {
      console.warn('[Reminder] Schedule error:', e)
    }
  }, [])

  const checkReminders = useCallback(async () => {
    const [pending, upcomingData] = await Promise.all([
      memoStore.getPendingReminders(),
      memoStore.getUpcomingReminders(),
    ])
    setPendingCount(pending.length)
    setUpcoming(upcomingData)

    if (isNative) {
      for (const memo of upcomingData) {
        await scheduleOne(memo)
      }
    }
  }, [scheduleOne])

  const scheduleForMemo = useCallback(async (memo) => {
    if (!isNative) return
    try {
      await scheduleOne(memo)
    } catch (e) {
      console.warn('[Reminder] scheduleForMemo error:', e)
    }
  }, [scheduleOne])

  useEffect(() => {
    if (isNative) {
      LocalNotifications.createChannel({
        id: 'scheduling-reminders',
        name: '排班提醒',
        description: '排班日历的提醒',
        importance: 4,
        sound: 'default',
        visibility: 1,
      }).catch(() => {})
    }

    checkReminders()
    intervalRef.current = setInterval(checkReminders, 30000)

    const handler = () => checkReminders()
    window.addEventListener('memo-changed', handler)
    return () => {
      clearInterval(intervalRef.current)
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
    scheduleForMemo,
  }
}

import { useState, useCallback, useEffect, useRef } from 'react'
import * as memoStore from '../db/memoStore'
import { Capacitor } from '@capacitor/core'

/**
 * 提醒 Hook
 * 使用 Capacitor Local Notifications 实现原生通知和闹钟
 * 仅影响本 App，不会影响手机其他软件
 */

const isNative = Capacitor.isNativePlatform()

// 懒加载 LocalNotifications：用 registerPlugin 方式安全加载
let LocalNotifications = null

async function loadLocalNotifications() {
  if (LocalNotifications) return LocalNotifications
  if (!isNative) return null
  try {
    const mod = await import('@capacitor/local-notifications')
    LocalNotifications = mod.LocalNotifications

    // 创建 Android 通知频道（Android 8+ 必需）
    try {
      await LocalNotifications.createChannel({
        id: 'scheduling-reminders',
        name: '排班提醒',
        description: '排班日历的提醒和闹钟通知',
        importance: 5, // IMPORTANCE_HIGH
        sound: 'default',
        visibility: 1,
      })
    } catch {
      // 频道可能已存在，忽略
    }

    return LocalNotifications
  } catch (e) {
    console.warn('LocalNotifications 插件未加载:', e)
    return null
  }
}

function hashMemoId(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % 1000000
}

export function useReminder() {
  const [upcoming, setUpcoming] = useState([])
  const [pendingCount, setPendingCount] = useState(0)
  const intervalRef = useRef(null)
  const scheduledRef = useRef(new Set())

  const checkReminders = useCallback(async () => {
    const [pending, upcomingData] = await Promise.all([
      memoStore.getPendingReminders(),
      memoStore.getUpcomingReminders(),
    ])
    setPendingCount(pending.length)
    setUpcoming(upcomingData)

    // 自动调度原生通知
    if (isNative) {
      const ln = await loadLocalNotifications()
      if (!ln) return

      for (const memo of upcomingData) {
        if (memo.remindAt && !scheduledRef.current.has(memo.id)) {
          try {
            const remindTime = new Date(memo.remindAt)
            if (remindTime <= new Date()) continue

            await ln.schedule({
              notifications: [{
                id: hashMemoId(memo.id),
                title: '排班提醒',
                body: memo.content,
                schedule: { at: remindTime },
                sound: memo.isAlarm ? 'default' : undefined,
                channelId: 'scheduling-reminders',
                smallIcon: 'ic_stat_notification',
                extra: { memoId: memo.id, date: memo.date },
              }],
            })
            scheduledRef.current.add(memo.id)
          } catch {
            // 调度失败，下次重试
          }
        }
      }
    }
  }, [])

  useEffect(() => {
    checkReminders()
    intervalRef.current = setInterval(checkReminders, 30000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [checkReminders])

  /**
   * 请求通知权限（Android 13+ 需要动态申请）
   */
  const requestPermission = useCallback(async () => {
    if (isNative) {
      const ln = await loadLocalNotifications()
      if (ln) {
        try {
          const permResult = await ln.requestPermissions()
          return permResult.display === 'granted'
        } catch {
          return false
        }
      }
    }

    // 降级：浏览器通知
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    const result = await Notification.requestPermission()
    return result === 'granted'
  }, [])

  /**
   * 为特定备忘录调度通知（在保存备注后立即调用）
   */
  const scheduleForMemo = useCallback(async (memo) => {
    if (!memo.remindAt || !isNative) return
    const ln = await loadLocalNotifications()
    if (!ln) return

    try {
      const remindTime = new Date(memo.remindAt)
      if (remindTime <= new Date()) return

      await ln.schedule({
        notifications: [{
          id: hashMemoId(memo.id),
          title: '排班提醒',
          body: memo.content,
          schedule: { at: remindTime },
          sound: memo.isAlarm ? 'default' : undefined,
          channelId: 'scheduling-reminders',
          smallIcon: 'ic_stat_notification',
          extra: { memoId: memo.id, date: memo.date },
        }],
      })
      scheduledRef.current.add(memo.id)
    } catch {
      // 忽略
    }
  }, [])

  return {
    upcoming,
    pendingCount,
    checkReminders,
    requestPermission,
    scheduleForMemo,
  }
}

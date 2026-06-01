import { useState, useCallback, useEffect, useRef } from 'react'
import * as memoStore from '../db/memoStore'
import { Capacitor } from '@capacitor/core'

/**
 * 提醒 Hook
 * 使用 Capacitor Local Notifications 实现原生通知和闹钟
 * 仅影响本 App，不会影响手机其他软件
 */

// 是否为原生 App 环境（APK）
const isNative = Capacitor.isNativePlatform()

// 动态加载本地通知插件
let LocalNotifications = null
if (isNative) {
  import('@capacitor/local-notifications').then((mod) => {
    LocalNotifications = mod.LocalNotifications
  }).catch(() => {
    // 插件未安装，降级
  })
}

/**
 * 调度原生本地通知
 */
async function scheduleNativeNotification(memo) {
  if (!LocalNotifications) return false

  const remindTime = new Date(memo.remindAt)
  const now = new Date()
  if (remindTime <= now) return false

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: hashMemoId(memo.id),
          title: '排班提醒',
          body: memo.content,
          schedule: { at: remindTime },
          sound: memo.isAlarm ? 'default' : undefined,
          smallIcon: 'ic_stat_notification',
          largeIcon: 'ic_launcher_foreground',
          extra: { memoId: memo.id, date: memo.date },
        },
      ],
    })
    return true
  } catch {
    return false
  }
}

/**
 * 取消已调度的通知
 */
async function cancelNativeNotification(memoId) {
  if (!LocalNotifications) return
  try {
    await LocalNotifications.cancel({ notifications: [{ id: hashMemoId(memoId) }] })
  } catch {
    // 忽略
  }
}

/**
 * 将字符串 ID 转成数字 ID（LocalNotifications 需要数字 ID）
 */
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

    // 自动调度未设置原生通知的提醒（仅原生 App 环境）
    if (isNative) {
      for (const memo of upcomingData) {
        if (memo.remindAt && !scheduledRef.current.has(memo.id)) {
          const ok = await scheduleNativeNotification(memo)
          if (ok) scheduledRef.current.add(memo.id)
        }
      }
    }
  }, [])

  // 定期检查提醒（每 30 秒）
  useEffect(() => {
    checkReminders()
    intervalRef.current = setInterval(checkReminders, 30000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [checkReminders])

  /**
   * 请求通知权限
   */
  const requestPermission = useCallback(async () => {
    if (isNative && LocalNotifications) {
      try {
        const permResult = await LocalNotifications.requestPermissions()
        return permResult.display === 'granted'
      } catch {
        return false
      }
    }

    // 降级：浏览器通知
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
  }
}

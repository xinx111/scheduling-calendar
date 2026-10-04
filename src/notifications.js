import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import * as memoStore from './db/memoStore'

const isNative = Capacitor.isNativePlatform()

// 会话内已调度的原生通知，避免重复挂起
const scheduledIds = new Set()
// Web 端已弹过的提醒，避免重复弹窗
const shownWebIds = new Set()
// Web 端只补弹 1 分钟内到期的提醒，避免重启后一次性弹出历史提醒
const WEB_GRACE_MS = 60 * 1000
// 通知通道 ID（通道属性首次创建后不可变，改配置需要换新 ID）
const REMINDER_CHANNEL_ID = 'scheduling-reminders'
// 测试通知的固定 ID
const TEST_NOTIFICATION_ID = 999999999

function hashMemoId(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % 1000000
}

export async function ensureReminderChannel() {
  if (!isNative) return
  try {
    await LocalNotifications.createChannel({
      id: REMINDER_CHANNEL_ID,
      name: '排班提醒',
      description: '排班日历的提醒和闹钟',
      importance: 5,
      sound: 'default',
      vibration: true,
      visibility: 1,
    })
  } catch (e) {
    console.warn('[Reminder] createChannel error:', e)
  }
}

/**
 * 为单条备忘录调度原生通知（仅原生平台）
 */
export async function scheduleMemoNotification(memo) {
  if (!memo || !memo.remindAt || scheduledIds.has(memo.id)) return
  const remindTime = new Date(memo.remindAt)
  if (remindTime <= new Date()) return

  if (!isNative) return

  try {
    const perm = await LocalNotifications.checkPermissions()
    if (perm.display !== 'granted') {
      const req = await LocalNotifications.requestPermissions()
      if (req.display !== 'granted') return
    }
  } catch (e) {
    console.warn('[Reminder] permission error:', e)
  }

  try {
    await ensureReminderChannel()
    await LocalNotifications.schedule({
      notifications: [
        {
          id: hashMemoId(memo.id),
          title: '排班提醒',
          body: memo.content,
          schedule: { at: remindTime },
          sound: memo.isAlarm ? 'default' : undefined,
          channelId: REMINDER_CHANNEL_ID,
          smallIcon: 'ic_stat_notification',
          extra: { memoId: memo.id },
        },
      ],
    })
    scheduledIds.add(memo.id)
  } catch (e) {
    console.warn('[Reminder] schedule error:', e)
  }
}

/**
 * 取消某条备忘录已挂起的原生通知
 */
export async function cancelMemoNotification(id) {
  if (!id || !isNative) return
  try {
    const originalId = memoStore.resolveOriginalMemoId(id)
    await LocalNotifications.cancel({ notifications: [{ id: hashMemoId(originalId) }] })
    scheduledIds.delete(originalId)
  } catch (e) {
    console.warn('[Reminder] cancel error:', e)
  }
}

/**
 * 修改备忘录后：取消旧通知并按新内容重新挂起
 */
export async function rescheduleMemoNotification(oldId, newMemo) {
  await cancelMemoNotification(oldId)
  await scheduleMemoNotification(newMemo)
}

/**
 * 应用启动时补挂所有未触发的提醒（仅原生平台）
 */
export async function scheduleAllPending() {
  if (!isNative) return
  try {
    const upcoming = await memoStore.getUpcomingReminders()
    for (const memo of upcoming) {
      await scheduleMemoNotification(memo)
    }
  } catch (e) {
    console.warn('[Reminder] scheduleAllPending error:', e)
  }
}

/**
 * Web 端兜底：应用打开时到期即刻弹浏览器通知
 */
export async function checkWebReminders() {
  if (isNative || !('Notification' in window) || Notification.permission !== 'granted') {
    return
  }
  try {
    const now = Date.now()
    const pending = await memoStore.getPendingReminders()
    for (const memo of pending) {
      if (!memo.remindAt || shownWebIds.has(memo.id)) continue
      const late = now - memo.remindAt
      if (late < 0 || late > WEB_GRACE_MS) continue
      shownWebIds.add(memo.id)
      new Notification('排班提醒', { body: memo.content })
    }
  } catch (e) {
    console.warn('[Reminder] web check error:', e)
  }
}

/**
 * 发送一条 5 秒后的测试通知，用于验证提示音与震动
 */
export async function sendTestNotification() {
  if (!isNative) return false
  try {
    const perm = await LocalNotifications.checkPermissions()
    if (perm.display !== 'granted') {
      const req = await LocalNotifications.requestPermissions()
      if (req.display !== 'granted') return false
    }
    await ensureReminderChannel()
    await LocalNotifications.schedule({
      notifications: [
        {
          id: TEST_NOTIFICATION_ID,
          title: '测试提醒',
          body: '收到这条通知并有提示音和震动，说明提醒功能正常',
          schedule: { at: new Date(Date.now() + 5000) },
          channelId: REMINDER_CHANNEL_ID,
          smallIcon: 'ic_stat_notification',
        },
      ],
    })
    return true
  } catch (e) {
    console.warn('[Reminder] test error:', e)
    return false
  }
}

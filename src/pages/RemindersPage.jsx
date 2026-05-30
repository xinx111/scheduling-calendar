import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReminder } from '../hooks/useReminder'
import * as memoStore from '../db/memoStore'
import { showToast } from '../components/Toast'

export default function RemindersPage() {
  const navigate = useNavigate()
  const { upcoming, pendingCount, requestPermission } = useReminder()
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const pending = await memoStore.getPendingReminders()
      setReminders(pending)
      setLoading(false)
    }
    load()
  }, [pendingCount])

  const handleMarkDone = async (id) => {
    await memoStore.markMemoDone(id)
    setReminders((prev) => prev.filter((r) => r.id !== id))
    showToast('已标记完成')
  }

  const handleDelete = async (id) => {
    await memoStore.deleteMemo(id)
    setReminders((prev) => prev.filter((r) => r.id !== id))
    showToast('已删除')
  }

  const handleRequestPermission = async () => {
    const granted = await requestPermission()
    if (granted) {
      showToast('通知权限已开启')
    } else {
      showToast('通知权限被拒绝，请在浏览器设置中开启', 'warning')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-700">🔔 提醒列表</h2>
        <span className="text-xs text-slate-400 bg-gray-100 px-2 py-1 rounded-full">
          待提醒 {reminders.length}
        </span>
      </div>

      {/* 通知权限提示 */}
      <div className="card bg-primary-50 border-primary-100">
        <p className="text-xs text-primary-600">
          如需接收弹窗提醒，请开启通知权限
        </p>
        <button
          onClick={handleRequestPermission}
          className="mt-2 text-xs text-primary-700 font-medium underline"
        >
          开启通知
        </button>
      </div>

      {/* 提醒列表 */}
      {reminders.length === 0 ? (
        <div className="card text-center py-8">
          <div className="text-3xl mb-2">🔕</div>
          <p className="text-sm text-slate-400">暂无待提醒事项</p>
          <p className="text-xs text-slate-400 mt-1">
            在日期详情页添加备注时可设置提醒
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="card flex items-start gap-3">
              <div className="mt-0.5 text-lg">
                {reminder.isAlarm ? '⏰' : '🔔'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">
                  {reminder.content}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  📅 {reminder.date}
                  {reminder.remindAt &&
                    ` · ${new Date(reminder.remindAt).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`}
                  {reminder.isAlarm && ' · ⏰ 闹钟'}
                </p>
                <button
                  onClick={() => navigate(`/day/${reminder.date}`)}
                  className="text-xs text-primary-600 mt-1"
                >
                  查看详情 →
                </button>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleMarkDone(reminder.id)}
                  className="px-2 py-1 text-xs rounded-full bg-green-50 text-green-600"
                >
                  完成
                </button>
                <button
                  onClick={() => handleDelete(reminder.id)}
                  className="px-2 py-1 text-xs rounded-full bg-red-50 text-red-400"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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
    let mounted = true
    const load = async () => {
      const pending = await memoStore.getPendingReminders()
      if (!mounted) return
      setReminders(pending)
      setLoading(false)
    }
    load()
    const onMemoChanged = () => load()
    window.addEventListener('memo-changed', onMemoChanged)
    return () => {
      mounted = false
      window.removeEventListener('memo-changed', onMemoChanged)
    }
  }, [pendingCount])

  const handleMarkDone = async (id) => {
    await memoStore.markMemoDone(id)
    setReminders((prev) => prev.filter((r) => r.id !== id))
    showToast('已标记完成')
    window.dispatchEvent(new CustomEvent('memo-changed'))
  }

  const handleDelete = async (id) => {
    await memoStore.deleteMemo(id)
    setReminders((prev) => prev.filter((r) => r.id !== id))
    showToast('已删除')
    window.dispatchEvent(new CustomEvent('memo-changed'))
  }

  const handleRequestPermission = async () => {
    const granted = await requestPermission()
    if (granted) showToast('通知权限已开启')
    else showToast('通知权限被拒绝，请在浏览器设置中开启', 'warning')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="space-y-3.5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔔</span>
          <h2 className="text-lg font-bold text-slate-700">提醒列表</h2>
        </div>
        <span className="text-xs font-medium text-slate-500 bg-gray-100 px-3 py-1.5 rounded-full">
          {reminders.length} 条待提醒
        </span>
      </div>

      {/* 通知权限 */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-primary-50 to-primary-50/40 border border-primary-100/60">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-primary-700">🔔 弹窗提醒</p>
            <p className="text-[11px] text-primary-500 mt-0.5">开启后可接收浏览器通知</p>
          </div>
          <button onClick={handleRequestPermission}
            className="text-xs font-semibold text-white px-4 py-2 rounded-xl bg-primary-500 active:bg-primary-600 transition-colors shadow-sm">
            开启通知
          </button>
        </div>
      </div>

      {/* 列表 */}
      {reminders.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-4xl block mb-3">🔕</span>
          <p className="text-sm text-slate-400 font-medium">暂无待提醒事项</p>
          <p className="text-xs text-slate-400 mt-1.5">在排班时添加备注可设置提醒</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="card flex items-start gap-3 py-3.5">
              <div className="mt-0.5 text-lg w-8 flex-shrink-0 text-center">
                {reminder.isAlarm ? '⏰' : '🔔'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700">{reminder.content}</p>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <span>📅 {reminder.date}</span>
                  {reminder.remindAt && (
                    <span>· {new Date(reminder.remindAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                  {reminder.isAlarm && <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-600 font-medium">闹钟</span>}
                </p>
                <button onClick={() => navigate(`/day/${reminder.date}`)}
                  className="text-xs font-medium text-primary-600 mt-1.5 hover:underline">查看详情 →</button>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => handleMarkDone(reminder.id)}
                  className="px-3 py-1.5 text-xs font-medium rounded-xl bg-emerald-50 text-emerald-600 active:bg-emerald-100 transition-colors">完成</button>
                <button onClick={() => handleDelete(reminder.id)}
                  className="px-3 py-1.5 text-xs font-medium rounded-xl bg-rose-50 text-rose-400 active:bg-rose-100 transition-colors">删除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

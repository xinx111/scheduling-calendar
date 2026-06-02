import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSchedules } from '../hooks/useSchedules'
import { useMemos } from '../hooks/useMemos'
import ShiftBadge from '../components/ShiftBadge'
import { formatDate, getWeekdayName, parseDate } from '../utils/date'
import { showToast } from '../components/Toast'
import * as memoStore from '../db/memoStore'

export default function DayDetailPage() {
  const { date } = useParams()
  const navigate = useNavigate()
  const { getDayInfo } = useSchedules()
  const { memos, loadByDate, addMemo, deleteMemo, markDone } = useMemos()
  const [dayInfo, setDayInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddMemo, setShowAddMemo] = useState(false)
  const [memoContent, setMemoContent] = useState('')
  const [memoTime, setMemoTime] = useState('')
  const [memoIsAlarm, setMemoIsAlarm] = useState(false)

  useEffect(() => {
    if (!date) return

    const load = async () => {
      setLoading(true)
      const [info] = await Promise.all([
        getDayInfo(date),
        loadByDate(date),
      ])
      setDayInfo(info)
      setLoading(false)
    }

    load()
  }, [date, getDayInfo, loadByDate])

  const handleAddMemo = async () => {
    if (!memoContent.trim()) return

    let remindAt = null
    if (memoTime) {
      remindAt = new Date(`${date}T${memoTime}:00`).getTime()
    }

    await addMemo({
      date,
      content: memoContent.trim(),
      remindAt,
      isAlarm: memoIsAlarm,
    })

    setMemoContent('')
    setMemoTime('')
    setMemoIsAlarm(false)
    setShowAddMemo(false)
    showToast('备注已添加')
    window.dispatchEvent(new CustomEvent('memo-changed'))
  }

  const handleDeleteMemo = async (id) => {
    await deleteMemo(id, date)
    showToast('备注已删除')
    window.dispatchEvent(new CustomEvent('memo-changed'))
  }

  const handleMarkDone = async (id) => {
    await markDone(id, date)
    window.dispatchEvent(new CustomEvent('memo-changed'))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    )
  }

  const dayOfWeek = getWeekdayName(date)
  const parsedDate = parseDate(date)
  const displayDate = `${parsedDate.getFullYear()}年${parsedDate.getMonth() + 1}月${parsedDate.getDate()}日`

  return (
    <div className="space-y-3.5 animate-fade-in">
      {/* 返回 + 标题 */}
      <div className="flex items-center gap-3 card !p-3">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 active:scale-90 transition-all text-slate-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        </button>
        <div className="flex items-center gap-2.5">
          <div>
            <h2 className="text-base font-bold text-slate-700">{displayDate}</h2>
            <span className="text-xs text-slate-400">周{dayOfWeek}</span>
          </div>
        </div>
      </div>

      {/* 排班信息 */}
      {dayInfo?.grouped && dayInfo.grouped.length > 0 ? (
        <div className="space-y-2.5">
          {dayInfo.grouped.map((group) => (
            <div key={group.shift.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <ShiftBadge shift={group.shift} size="lg" showTime />
                <span className="text-xs text-slate-400 font-medium">{group.persons.length}人</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.persons.map((person) => (
                  <span key={person.id}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm bg-gray-50 border border-gray-100/80 shadow-sm">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-white font-bold"
                      style={{ backgroundColor: person.color }}>
                      {person.avatar || person.name.charAt(0)}
                    </span>
                    <span className="font-medium text-slate-700">{person.name}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-10">
          <span className="text-4xl block mb-3">📭</span>
          <p className="text-sm text-slate-400 font-medium">当天无排班信息</p>
          <p className="text-xs text-slate-400 mt-1">点击日历可手动排班</p>
        </div>
      )}

      {/* 备注区域 */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">📝</span>
            <h3 className="text-sm font-bold text-slate-600">备注与提醒</h3>
          </div>
          <button
            onClick={() => setShowAddMemo(true)}
            className="text-xs text-primary-600 font-medium px-3 py-1 rounded-full bg-primary-50 active:bg-primary-100"
          >
            ＋ 添加
          </button>
        </div>

        {memos.length === 0 && !showAddMemo && (
          <p className="text-xs text-slate-400 text-center py-4">
            暂无备注，点击上方添加
          </p>
        )}

        {/* 备注列表 */}
        <div className="space-y-2">
          {memos.map((memo) => (
            <div
              key={memo.id}
              className={`flex items-start gap-2 p-3 rounded-xl ${
                memo.isDone ? 'bg-gray-50 opacity-60' : 'bg-amber-50'
              }`}
            >
              <input
                type="checkbox"
                checked={memo.isDone}
                onChange={() => handleMarkDone(memo.id)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm ${
                    memo.isDone ? 'line-through text-slate-400' : 'text-slate-700'
                  }`}
                >
                  {memo.content}
                </p>
                {memo.remindAt && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    🔔 {new Date(memo.remindAt).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {memo.isAlarm ? ' ⏰ 闹钟' : ''}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDeleteMemo(memo.id)}
                className="text-slate-300 hover:text-red-400 text-xs p-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* 添加备注表单 */}
        {showAddMemo && (
          <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
            <textarea
              value={memoContent}
              onChange={(e) => setMemoContent(e.target.value)}
              placeholder="输入备注内容..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300"
              rows={3}
              autoFocus
            />
            <label className="flex items-center gap-2 py-2.5 px-3 rounded-xl bg-amber-50 border border-amber-100">
              <input
                type="checkbox"
                checked={memoIsAlarm}
                onChange={(e) => setMemoIsAlarm(e.target.checked)}
                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
              />
              <span className="text-xs font-medium text-amber-700">
                ⏰ 闹钟提醒（响铃+震动）
              </span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">🔔 提醒时间</span>
              <input
                type="time"
                value={memoTime}
                onChange={(e) => setMemoTime(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddMemo}
                disabled={!memoContent.trim()}
                className="flex-1 btn-primary text-sm py-2 text-center"
              >
                保存
              </button>
              <button
                onClick={() => setShowAddMemo(false)}
                className="btn-secondary text-sm py-2 text-center"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

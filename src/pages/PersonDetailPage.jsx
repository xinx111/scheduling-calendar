import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPerson } from '../db/personStore'
import { getPersonSchedulesInRange } from '../db/scheduleStore'
import { getShift, getAllShifts } from '../db/shiftStore'
import { getMemosInRangeByPerson, addMemo, deleteMemo, markMemoDone, updateMemo, resolveOriginalMemoId } from '../db/memoStore'
import { getPersonCycles, getShiftIdFromCycle } from '../db/cycleStore'
import { today, getWeekdayName, parseDate, getDaysInMonth } from '../utils/date'
import { showToast } from '../components/Toast'
import { scheduleMemoNotification, rescheduleMemoNotification, cancelMemoNotification } from '../notifications'

function toTimeInputValue(ts) {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function PersonDetailPage() {
  const { personId } = useParams()
  const navigate = useNavigate()
  const [person, setPerson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [totalDays, setTotalDays] = useState(0)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  })
  const [memos, setMemos] = useState([])
  const [allShifts, setAllShifts] = useState([])
  const [showMemoInput, setShowMemoInput] = useState(false)
  const [editingMemoId, setEditingMemoId] = useState(null)
  const [memoContent, setMemoContent] = useState('')
  const [memoTime, setMemoTime] = useState('')
  const [memoDate, setMemoDate] = useState(today())

  const daysInMonth = new Date(currentMonth.year, currentMonth.month, 0).getDate()

  const getMonthRange = () => {
    const startDate = `${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}-01`
    const lastDay = new Date(currentMonth.year, currentMonth.month, 0).getDate()
    const endDate = `${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    return { startDate, endDate }
  }

  const loadMemos = useCallback(async () => {
    if (!personId) return
    const { startDate, endDate } = getMonthRange()
    const data = await getMemosInRangeByPerson(startDate, endDate, personId)
    setMemos(data)
  }, [personId, currentMonth])

  const goToPrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 1) return { year: prev.year - 1, month: 12 }
      return { year: prev.year, month: prev.month - 1 }
    })
  }
  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 12) return { year: prev.year + 1, month: 1 }
      return { year: prev.year, month: prev.month + 1 }
    })
  }

  useEffect(() => {
    if (!personId) return

    const load = async () => {
      setLoading(true)
      const p = await getPerson(personId)
      setPerson(p)

      const startDate = `${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}-01`
      const lastDay = new Date(currentMonth.year, currentMonth.month, 0).getDate()
      const endDate = `${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      // 排班记录 + 周期统计
      const records = await getPersonSchedulesInRange(personId, startDate, endDate)
      const cycles = await getPersonCycles(personId)
      const shiftCount = {}
      let total = 0
      const shiftMap = {}
      const dateSet = new Set()
      for (const r of records) {
        dateSet.add(r.date)
        if (!shiftMap[r.shiftId]) shiftMap[r.shiftId] = await getShift(r.shiftId)
        const s = shiftMap[r.shiftId]
        if (s) { shiftCount[s.name] = (shiftCount[s.name] || 0) + 1; total++ }
      }
      if (cycles.length > 0) {
        for (let d = 1; d <= daysInMonth; d++) {
          const ds = `${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          if (!dateSet.has(ds)) {
            const sid = getShiftIdFromCycle(cycles, ds)
            if (sid) {
              if (!shiftMap[sid]) shiftMap[sid] = await getShift(sid)
              const s = shiftMap[sid]
              if (s) { shiftCount[s.name] = (shiftCount[s.name] || 0) + 1; total++ }
            }
          }
        }
      }
      setStats(shiftCount)
      setTotalDays(total)

      const all = await getAllShifts()
      setAllShifts(all)

      await loadMemos()
      setLoading(false)
    }
    load()
  }, [personId, currentMonth, loadMemos])

  const handleEditMemo = (memo) => {
    setEditingMemoId(resolveOriginalMemoId(memo.id))
    setMemoContent(memo.content)
    setMemoDate(memo.date)
    setMemoTime(memo.remindAt ? toTimeInputValue(memo.remindAt) : '')
    setShowMemoInput(true)
  }

  const handleAddMemo = async () => {
    if (!memoContent.trim()) return
    try {
      let remindAt = null
      if (memoTime) remindAt = new Date(`${memoDate}T${memoTime}:00`).getTime()
      if (editingMemoId) {
        const updated = await updateMemo(editingMemoId, {
          content: memoContent.trim(),
          remindAt,
          isAlarm: !!memoTime,
        })
        await rescheduleMemoNotification(editingMemoId, updated)
        showToast('备注已更新')
      } else {
        const memo = await addMemo({
          date: memoDate,
          content: memoContent.trim(),
          remindAt,
          isAlarm: !!memoTime,
          personId,
        })
        scheduleMemoNotification(memo)
        showToast('备注已添加')
      }
      setEditingMemoId(null)
      setMemoContent('')
      setMemoTime('')
      setShowMemoInput(false)
      await loadMemos()
    } catch (err) {
      showToast('保存失败: ' + err.message, 'error')
    }
  }

  const handleDeleteMemo = async (id) => {
    await cancelMemoNotification(id)
    await deleteMemo(id)
    showToast('备注已删除')
    loadMemos()
  }

  const handleMarkDone = async (id) => {
    await cancelMemoNotification(id)
    await markMemoDone(id)
    loadMemos()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    )
  }

  if (!person) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">人员不存在</div>
    )
  }

  const title = `${currentMonth.year}年${currentMonth.month}月`

  return (
    <div className="space-y-3.5 animate-fade-in">
      <div className="flex items-center gap-3 card !p-3">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 active:scale-90 transition-all text-slate-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        </button>
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg text-white font-bold shadow-sm"
            style={{ backgroundColor: person.color }}>
            {person.avatar || person.name.charAt(0)}
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-700">{person.name}</h2>
            <p className="text-xs text-slate-400">{person.isActive ? '活跃' : '已隐藏'}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">📊</span>
            <h3 className="text-sm font-bold text-slate-600">月统计</h3>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={goToPrevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-slate-500 text-sm">‹</button>
            <span className="text-xs font-semibold text-slate-600 min-w-[72px] text-center">{title}</span>
            <button onClick={goToNextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-slate-500 text-sm">›</button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {allShifts.map((s) => {
            const count = stats[s.name] || 0
            const maxCount = Math.max(...allShifts.map((sh) => stats[sh.name] || 0), 1)
            const pct = (count / maxCount) * 100
            return (
              <div key={s.id} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100/60">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{s.icon}</span>
                  <span className="text-xs text-slate-400">{s.shortName || s.name}</span>
                </div>
                <p className="text-xl font-bold text-slate-700">{count}<span className="text-xs font-normal text-slate-400 ml-0.5">天</span></p>
                <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">本月共 {totalDays} 天排班 · 出勤率 {Math.round((totalDays / daysInMonth) * 100)}%</p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">📝</span>
            <h3 className="text-sm font-bold text-slate-600">本月备注</h3>
          </div>
          <button onClick={() => {
              const now = today()
              const monthPrefix = `${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}`
              setMemoDate(now.startsWith(monthPrefix) ? now : `${monthPrefix}-01`)
              setEditingMemoId(null)
              setShowMemoInput(true)
            }}
            className="text-xs font-medium text-primary-600 px-3 py-1 rounded-full bg-primary-50 active:bg-primary-100 transition-colors">＋ 添加</button>
        </div>

        {showMemoInput && (
          <div className="mb-3 p-3 rounded-xl bg-gray-50 space-y-2">
            <textarea value={memoContent} onChange={(e) => setMemoContent(e.target.value)}
              placeholder="输入备注内容..." className="input-field" rows={2} autoFocus />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">📅</span>
              <input type="date" value={memoDate} onChange={(e) => setMemoDate(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white" />
              <span className="text-xs text-slate-400">备注日期</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">🔔</span>
              <input type="time" value={memoTime} onChange={(e) => setMemoTime(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white" />
              <span className="text-xs text-slate-400">提醒时间</span>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddMemo} disabled={!memoContent.trim()}
                className="flex-1 py-2 rounded-xl text-sm font-medium bg-primary-500 text-white disabled:opacity-50 active:scale-[0.98] transition-all">{editingMemoId ? '保存修改' : '保存'}</button>
              <button onClick={() => setShowMemoInput(false)}
                className="flex-1 py-2 rounded-xl text-sm font-medium bg-white text-slate-500 border border-gray-200 active:scale-[0.98] transition-all">取消</button>
            </div>
          </div>
        )}

        {memos.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">本月暂无备注</p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {memos.sort((a, b) => b.createdAt - a.createdAt).map((memo) => (
              <div key={memo.id} className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50/60">
                <input type="checkbox" checked={memo.isDone}
                  onChange={() => handleMarkDone(memo.id)}
                  className="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 text-primary-500 focus:ring-primary-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${memo.isDone ? 'line-through text-slate-400' : 'text-slate-700'}`}>{memo.content}</p>
                  <p className="text-xs text-slate-400 mt-0.5">📅 {memo.date}{memo.remindAt && ` · ${new Date(memo.remindAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`}</p>
                </div>
                <button onClick={() => handleEditMemo(memo)}
                  className="text-xs text-slate-300 hover:text-primary-400 p-1 flex-shrink-0">✎</button>
                <button onClick={() => handleDeleteMemo(memo.id)}
                  className="text-xs text-slate-300 hover:text-rose-400 p-1 flex-shrink-0">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

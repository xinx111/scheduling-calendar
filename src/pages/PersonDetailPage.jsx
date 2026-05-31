import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPerson } from '../db/personStore'
import { getPersonSchedulesInRange } from '../db/scheduleStore'
import { getShift, getAllShifts } from '../db/shiftStore'
import { getMemosInRange, addMemo, deleteMemo, markMemoDone } from '../db/memoStore'
import { today, getWeekdayName, parseDate } from '../utils/date'
import { showToast } from '../components/Toast'

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
  // 添加备注
  const [showMemoInput, setShowMemoInput] = useState(false)
  const [memoContent, setMemoContent] = useState('')
  const [memoTime, setMemoTime] = useState('')

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

      // 加载排班记录
      const records = await getPersonSchedulesInRange(personId, startDate, endDate)
      const shiftCount = {}
      let total = 0
      const shiftMap = {}
      for (const r of records) {
        if (!shiftMap[r.shiftId]) shiftMap[r.shiftId] = await getShift(r.shiftId)
        const s = shiftMap[r.shiftId]
        if (s) {
          shiftCount[s.name] = (shiftCount[s.name] || 0) + 1
          total++
        }
      }
      setStats(shiftCount)
      setTotalDays(total)

      // 加载所有班次（用于渲染）
      const all = await getAllShifts()
      setAllShifts(all)

      // 加载备注
      const memos = await getMemosInRange(startDate, endDate)
      setMemos(memos)
      setLoading(false)
    }
    load()
  }, [personId, currentMonth])

  const handleAddMemo = async () => {
    if (!memoContent.trim()) return
    try {
      let remindAt = null
      if (memoTime) remindAt = new Date(`${today()}T${memoTime}:00`).getTime()
      await addMemo({ date: today(), content: memoContent.trim(), remindAt, isAlarm: !!memoTime })
      showToast('备注已添加')
      setMemoContent('')
      setMemoTime('')
      setShowMemoInput(false)

      // 刷新备注
      const startDate = `${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}-01`
      const lastDay = new Date(currentMonth.year, currentMonth.month, 0).getDate()
      const endDate = `${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      const memos = await getMemosInRange(startDate, endDate)
      setMemos(memos)
    } catch (err) {
      showToast('添加失败: ' + err.message, 'error')
    }
  }

  const handleDeleteMemo = async (id) => {
    await deleteMemo(id)
    setMemos((prev) => prev.filter((m) => m.id !== id))
    showToast('备注已删除')
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
      {/* 返回 + 标题 */}
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

      {/* 月统计 */}
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

        {/* 统计卡片 */}
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
        <p className="text-xs text-slate-400 mt-2 text-center">本月共 {totalDays} 天排班 · 出勤率 {Math.round((totalDays / 30) * 100)}%</p>
      </div>

      {/* 最近备注 */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">📝</span>
            <h3 className="text-sm font-bold text-slate-600">本月备注</h3>
          </div>
          <button onClick={() => setShowMemoInput(true)}
            className="text-xs font-medium text-primary-600 px-3 py-1 rounded-full bg-primary-50 active:bg-primary-100 transition-colors">＋ 添加</button>
        </div>

        {showMemoInput && (
          <div className="mb-3 p-3 rounded-xl bg-gray-50 space-y-2">
            <textarea value={memoContent} onChange={(e) => setMemoContent(e.target.value)}
              placeholder="输入备注内容..." className="input-field" rows={2} autoFocus />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">🔔</span>
              <input type="time" value={memoTime} onChange={(e) => setMemoTime(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white" />
              <span className="text-xs text-slate-400">提醒时间</span>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddMemo} disabled={!memoContent.trim()}
                className="flex-1 py-2 rounded-xl text-sm font-medium bg-primary-500 text-white disabled:opacity-50 active:scale-[0.98] transition-all">保存</button>
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
                  onChange={() => markMemoDone(memo.id).then(() => {
                    setMemos((prev) => prev.filter((m) => m.id !== memo.id))
                  })}
                  className="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 text-primary-500 focus:ring-primary-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${memo.isDone ? 'line-through text-slate-400' : 'text-slate-700'}`}>{memo.content}</p>
                  <p className="text-xs text-slate-400 mt-0.5">📅 {memo.date}{memo.remindAt && ` · ${new Date(memo.remindAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`}</p>
                </div>
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

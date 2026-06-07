import { useState, useEffect, useRef } from 'react'
import * as memoStore from '../db/memoStore'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { getSchedulesByDate } from '../db/scheduleStore'
import { getPerson, getActivePersons } from '../db/personStore'
import { getAllCyclePatterns, getShiftIdFromCycle, getPersonCycles } from '../db/cycleStore'
import { showToast } from './Toast'

const isNative = Capacitor.isNativePlatform()
const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

function hashMemoId(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0
  return Math.abs(hash) % 1000000
}

async function scheduleMemoNotification(memo) {
  if (!memo.remindAt || !isNative) return
  try {
    await LocalNotifications.createChannel({
      id: 'scheduling-reminders', name: '排班提醒',
      description: '排班日历提醒和闹钟', importance: 5, sound: 'default', visibility: 1,
    }).catch(() => {})
    const remindTime = new Date(memo.remindAt)
    if (remindTime <= new Date()) return
    await LocalNotifications.schedule({
      notifications: [{
        id: hashMemoId(memo.id), title: '排班提醒', body: memo.content,
        schedule: { at: remindTime }, sound: memo.isAlarm ? 'default' : undefined,
        channelId: 'scheduling-reminders', smallIcon: 'ic_stat_notification',
        extra: { memoId: memo.id },
      }],
    })
  } catch {}
}

export default function ShiftPicker({
  shifts, currentShiftId, date, personName, personId, isCycleShift,
  onSelect, onRemove, onClose,
}) {
  const [selectedId, setSelectedId] = useState(currentShiftId)
  const [colleagues, setColleagues] = useState(null)
  const [todayMemo, setTodayMemo] = useState(null)
  const hasChanged = selectedId !== currentShiftId
  const scrollRef = useRef(null)

  useEffect(() => {
    (async () => {
      if (!date) return
      try {
        const allRecords = await getSchedulesByDate(date)
        const allCycles = await getAllCyclePatterns()
        const allPersons = await getActivePersons()
        const grouped = {}
        for (const r of allRecords) {
          if (r.personId === personId) continue
          if (!grouped[r.shiftId]) grouped[r.shiftId] = []
          const p = allPersons.find((ap) => ap.id === r.personId) || await getPerson(r.personId)
          if (p && !grouped[r.shiftId].some((gp) => gp.id === p.id)) grouped[r.shiftId].push(p)
        }
        const personCycles = {}
        for (const c of allCycles) { if (!personCycles[c.personId]) personCycles[c.personId] = []; personCycles[c.personId].push(c) }
        for (const [pid, cycles] of Object.entries(personCycles)) {
          if (pid === personId) continue
          const shiftId = getShiftIdFromCycle(cycles, date)
          if (shiftId) {
            if (!grouped[shiftId]) grouped[shiftId] = []
            const p = allPersons.find((ap) => ap.id === pid) || await getPerson(pid)
            if (p && !grouped[shiftId].some((gp) => gp.id === p.id)) grouped[shiftId].push(p)
          }
        }
        setColleagues(grouped)
      } catch { setColleagues(null) }

      try {
        const c = await getPersonCycles(personId)
        const getShift = (d) => getShiftIdFromCycle(c, d) || null
        const memos = await memoStore.getMemosInRangeByPerson(date, date, personId, getShift)
        const pending = memos.filter((m) => !m.isDone)
        if (pending.length > 0) setTodayMemo(pending)
      } catch {}
    })()
  }, [date, personId])

  const [showMemo, setShowMemo] = useState(false)
  const [savedMemo, setSavedMemo] = useState(null)
  const [memoContent, setMemoContent] = useState('')
  const [memoTime, setMemoTime] = useState('')
  const [repeatType, setRepeatType] = useState('none')
  const [repeatWeekdays, setRepeatWeekdays] = useState([])

  const getRepeatRule = () => {
    if (repeatType === 'none') return null
    if (repeatType === 'daily') return { type: 'daily' }
    if (repeatType === 'weekly' && repeatWeekdays.length > 0) return { type: 'weekly', weekdays: repeatWeekdays }
    if (repeatType === 'shift' && selectedId) return { type: 'shift', shiftId: selectedId }
    return null
  }

  const toggleWeekday = (d) => {
    setRepeatWeekdays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d])
  }

  const handleConfirm = () => { if (selectedId) onSelect(selectedId); onClose() }

  const handleSaveMemo = async () => {
    if (!memoContent.trim()) return
    let remindAt = null
    if (memoTime) remindAt = new Date(`${date}T${memoTime}:00`).getTime()
    try {
      const repeatRule = getRepeatRule()
      const memo = await memoStore.addMemo({ date, content: memoContent.trim(), remindAt, isAlarm: !!memoTime, personId, repeatRule })
      setSavedMemo(memo)
      setShowMemo(false)
      setRepeatType('none')
      setRepeatWeekdays([])
      window.dispatchEvent(new CustomEvent('memo-changed'))
      await scheduleMemoNotification(memo)
    } catch (err) {
      showToast('保存备注失败: ' + err.message, 'error')
    }
  }

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="absolute bottom-14 left-0 right-0 bg-white rounded-t-3xl shadow-2xl flex flex-col animate-slide-up max-h-[70vh]"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0"><div className="w-10 h-1 rounded-full bg-gray-300/60" /></div>
        <div className="flex-shrink-0 px-5 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div><p className="text-base font-bold text-slate-800">{personName}</p><p className="text-xs text-slate-400 mt-0.5">{date}</p></div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-slate-400 transition-colors">✕</button>
          </div>
          <div className="mt-1.5 pt-2 border-t border-gray-50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">👥 同事排班</span>
              {todayMemo && todayMemo.length > 0 && <span className="text-[10px] text-amber-600 font-medium">📝 我的提醒 ({todayMemo.length})</span>}
            </div>
            {colleagues && Object.keys(colleagues).length > 0 ? (
              Object.entries(colleagues).map(([shiftId, persons]) => {
                const shiftObj = shifts.find((s) => s.id === shiftId)
                return (
                  <div key={shiftId} className="flex items-center gap-1 flex-wrap">
                    {shiftObj && <span className="text-[10px] px-1.5 py-0.5 rounded text-white font-medium" style={{ backgroundColor: shiftObj.color }}>{shiftObj.shortName || shiftObj.name}</span>}
                    {persons.map((p) => <span key={p.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-slate-600 font-medium"><span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />{p.name}</span>)}
                  </div>
                )
              })
            ) : <span className="text-[10px] text-slate-300">当天无其他同事排班</span>}
            {todayMemo && todayMemo.length > 0 && todayMemo.map((memo) => (
              <div key={memo.id} className="flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                <span>📝</span><span className="truncate flex-1">{memo.content}</span>
                {memo.remindAt && <span className="text-amber-500 flex-shrink-0">{new Date(memo.remindAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>}
              </div>
            ))}
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-5 py-3">
          <div className="grid grid-cols-4 gap-2">
            {shifts.map((shift) => {
              const isSelected = shift.id === selectedId
              return (
                <button key={shift.id} onClick={() => setSelectedId(isSelected ? null : shift.id)}
                  className={`flex flex-col items-center justify-center gap-0.5 px-2 py-2.5 rounded-xl transition-all duration-150 active:scale-90 ${isSelected ? 'text-white shadow-sm' : 'bg-white border border-gray-100/80 text-slate-600 hover:border-primary-200'}`}
                  style={{ backgroundColor: isSelected ? shift.color : undefined }}>
                  <span className="text-xl">{shift.icon}</span>
                  <span className={`text-[11px] font-semibold ${isSelected ? 'text-white' : ''}`}>{shift.shortName || shift.name}</span>
                  {isSelected && <span className="text-[8px] text-white/80">✓</span>}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-gray-100 px-5 pt-3 pb-6 space-y-2.5">
          {hasChanged || !currentShiftId ? (
            <button onClick={handleConfirm} disabled={!selectedId}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold text-center btn-primary disabled:opacity-40 shadow-lg shadow-primary-200/30">
              {currentShiftId ? `✓ 改为${shifts.find(s => s.id === selectedId)?.name || ''}排班` : '✓ 确认排班'}
            </button>
          ) : (
            <button onClick={onClose} className="w-full py-3.5 rounded-2xl text-sm font-semibold text-center bg-gray-100 text-slate-600 active:scale-[0.98] transition-all">已排班，点此关闭</button>
          )}
          {currentShiftId && !isCycleShift && (
            <button onClick={() => { onRemove(); onClose() }} className="w-full py-3 rounded-2xl text-sm font-medium text-rose-500 bg-rose-50/80 active:bg-rose-100 transition-colors">移除当前排班</button>
          )}
          {!showMemo && !savedMemo && (
            <button onClick={() => { setShowMemo(true); setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 350) }}
              className="w-full py-2.5 rounded-2xl text-sm font-medium text-amber-600 bg-amber-50/60 active:bg-amber-100 transition-colors">📝 添加备注与提醒</button>
          )}
          {savedMemo && (
            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/60">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-amber-800 font-medium">{savedMemo.content}</p>
                  {savedMemo.remindAt && <p className="text-xs text-amber-500 mt-0.5">🔔 {new Date(savedMemo.remindAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</p>}
                </div>
                <button onClick={() => { setSavedMemo(null); setShowMemo(true) }} className="text-xs text-amber-500 underline flex-shrink-0">修改</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showMemo && (
        <div className="modal-backdrop animate-fade-in z-[110]" onClick={() => setShowMemo(false)}>
          <div className="absolute bottom-14 left-0 right-0 bg-white rounded-t-3xl shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-gray-300/60" /></div>
            <div className="px-5 pb-6 space-y-3">
              <h3 className="text-base font-bold text-slate-700">📝 添加备注</h3>
              <p className="text-xs text-slate-400 -mt-2">{date} · {personName}</p>
              <textarea value={memoContent} onChange={(e) => setMemoContent(e.target.value)} placeholder="输入备注内容..." className="input-field" rows={3} autoFocus />

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">🔔</span>
                <input type="time" value={memoTime} onChange={(e) => setMemoTime(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white" />
                <span className="text-xs text-slate-400">提醒时间</span>
              </div>

              {/* 重复规则 */}
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">🔄 重复</p>
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { key: 'none', label: '不重复' },
                    { key: 'daily', label: '每天' },
                    { key: 'weekly', label: '每周' },
                    { key: 'shift', label: '按班次' },
                  ].map((opt) => (
                    <button key={opt.key} onClick={() => { setRepeatType(opt.key); if (opt.key !== 'weekly') setRepeatWeekdays([]) }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${repeatType === opt.key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-slate-500'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {repeatType === 'weekly' && (
                  <div className="flex gap-1 mt-1.5">
                    {WEEKDAY_LABELS.map((label, i) => (
                      <button key={i} onClick={() => toggleWeekday(i)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${repeatWeekdays.includes(i) ? 'bg-primary-500 text-white' : 'bg-gray-100 text-slate-500'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                {repeatType === 'shift' && selectedId && (
                  <p className="text-[10px] text-primary-500 mt-1">
                    当排班为「{shifts.find((s) => s.id === selectedId)?.name || ''}」时显示
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={handleSaveMemo} disabled={!memoContent.trim()}
                  className="flex-1 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-amber-500 to-amber-400 text-white disabled:opacity-50 active:scale-[0.98] transition-all shadow-lg shadow-amber-200/30">保存备注</button>
                <button onClick={() => setShowMemo(false)} className="flex-1 py-3 rounded-xl text-sm font-medium bg-white text-slate-500 border border-gray-200 active:scale-[0.98] transition-all">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

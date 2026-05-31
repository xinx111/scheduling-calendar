import { useState, useEffect } from 'react'
import { getAllShifts } from '../db/shiftStore'
import { getPersonCycles, deleteCyclePattern } from '../db/cycleStore'
import { today } from '../utils/date'
import { showToast } from './Toast'

export default function CycleDialog({
  personId,
  personName,
  onSave,
  onClose,
}) {
  const [shifts, setShifts] = useState([])
  const [existingCycles, setExistingCycles] = useState([])
  const [cycleDays, setCycleDays] = useState(7)
  const [pattern, setPattern] = useState([])
  const [startDate, setStartDate] = useState(today())
  const hasSelection = pattern.some((p) => p.shiftId)

  useEffect(() => {
    getAllShifts().then(setShifts)
    getPersonCycles(personId).then(setExistingCycles)
  }, [personId])

  const handleSave = () => {
    if (!hasSelection) return
    onSave({
      personId,
      cycleDays,
      startDate,
      pattern: pattern.filter((p) => p.shiftId),
      title: `${personName}的排班周期`,
    })
    // 重置表单
    setStartDate(today())
    setPattern([])
    setCycleDays(7)
  }

  const handleDeleteCycle = async (cycleId) => {
    try {
      await deleteCyclePattern(cycleId)
      showToast('周期已删除')
      setExistingCycles((prev) => prev.filter((c) => c.id !== cycleId))
    } catch (err) {
      showToast('删除失败: ' + err.message, 'error')
    }
  }

  const shiftMap = {}
  for (const s of shifts) {
    shiftMap[s.id] = s
  }

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="absolute bottom-14 left-0 right-0 bg-white rounded-t-3xl shadow-2xl flex flex-col animate-slide-up"
        style={{ maxHeight: '80vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300/60" />
        </div>

        <div className="flex-shrink-0 border-b border-gray-100 px-5 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-700">🔁 排班周期</h3>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-slate-400 transition-colors">✕</button>
          </div>
          <p className="text-xs text-slate-400 mt-1">{personName}</p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4 space-y-3">
          {/* ===== 已有周期列表 ===== */}
          {existingCycles.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-bold text-slate-500 mb-2">已设置的周期</p>
              <div className="space-y-2">
                {existingCycles.map((cycle) => {
                  const dayNames = cycle.pattern
                    .filter((p) => p.shiftId && shiftMap[p.shiftId])
                    .map((p) => shiftMap[p.shiftId].shortName || shiftMap[p.shiftId].name)
                    .join(' · ')
                  return (
                    <div key={cycle.id}
                      className="flex items-start gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700">{cycle.startDate} 起</span>
                          <span className="text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded">{cycle.cycleDays}天循环</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 truncate">{dayNames}</p>
                      </div>
                      <button onClick={() => handleDeleteCycle(cycle.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-xs text-rose-400 hover:bg-rose-50 transition-colors flex-shrink-0">✕</button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ===== 添加新周期表单 ===== */}
          <div className={existingCycles.length > 0 ? 'border-t border-gray-100 pt-3' : 'pt-2'}>
            {existingCycles.length > 0 && (
              <p className="text-xs font-bold text-slate-500 mb-2">添加新周期</p>
            )}

            {/* 起始日期 */}
            <div className="mb-3">
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">起始日期</label>
              <input type="date" value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field" />
              <p className="text-[10px] text-slate-400 mt-1">此日期之前不受该周期影响</p>
            </div>

            {/* 周期天数 */}
            <div className="mb-3">
              <label className="text-xs font-medium text-slate-500 mb-2 block">周期长度（天）</label>
              <div className="flex gap-2 flex-wrap">
                {[3, 4, 5, 6, 7].map((n) => (
                  <button key={n}
                    onClick={() => {
                      setCycleDays(n)
                      if (pattern.length < n) {
                        const newPattern = [...pattern]
                        for (let i = pattern.length; i < n; i++) {
                          newPattern[i] = { dayOffset: i, shiftId: '' }
                        }
                        setPattern(newPattern)
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      cycleDays === n ? 'bg-primary-600 text-white' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                    }`}>{n}天</button>
                ))}
              </div>
            </div>

            {/* 周期模式 */}
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">点击选择班次，再点取消</p>
              <div className="space-y-1">
                {Array.from({ length: cycleDays }).map((_, i) => {
                  const entry = pattern[i] || { dayOffset: i, shiftId: '' }
                  const date = new Date(startDate)
                  date.setDate(date.getDate() + i)
                  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                  return (
                    <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-50">
                      <span className="text-xs font-bold text-slate-500 w-12 flex-shrink-0 text-center leading-tight">
                        D{i + 1}<br /><span className="text-[9px] font-normal text-slate-400">{dateStr.slice(5)}</span>
                      </span>
                      <div className="flex-1 flex gap-1 overflow-x-auto">
                        {shifts.map((shift) => {
                          const isSelected = entry.shiftId === shift.id
                          return isSelected ? (
                            <button key={shift.id}
                              onClick={() => {
                                const newPattern = [...pattern]
                                newPattern[i] = { dayOffset: i, shiftId: '' }
                                setPattern(newPattern)
                              }}
                              className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-medium text-white active:opacity-80"
                              style={{ backgroundColor: shift.color }}>
                              {shift.icon}{shift.shortName || shift.name} ✕
                            </button>
                          ) : (
                            <button key={shift.id}
                              onClick={() => {
                                const newPattern = [...pattern]
                                newPattern[i] = { dayOffset: i, shiftId: shift.id }
                                setPattern(newPattern)
                              }}
                              className="px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap bg-white border border-gray-200 text-slate-500 active:bg-gray-100">
                              {shift.icon} {shift.shortName || shift.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-4">
              <button onClick={handleSave} disabled={!hasSelection}
                className="w-full btn-primary text-sm py-3 text-center disabled:opacity-50 shadow-lg shadow-primary-200/30">
                ➕ 添加此周期
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

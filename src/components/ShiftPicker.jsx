import { useState, useEffect } from 'react'
import { isLightColor } from '../utils/color'
import * as memoStore from '../db/memoStore'
import { getSchedulesByDate } from '../db/scheduleStore'
import { getPerson } from '../db/personStore'
import { showToast } from './Toast'

export default function ShiftPicker({
  shifts,
  currentShiftId,
  date,
  personName,
  personId,
  isCycleShift,
  onSelect,
  onRemove,
  onClose,
}) {
  const [selectedId, setSelectedId] = useState(currentShiftId)
  const [colleagues, setColleagues] = useState(null)
  const hasChanged = selectedId !== currentShiftId

  // 打开时自动加载当天所有同班同事
  useEffect(() => {
    (async () => {
      if (!date) { setColleagues([]); return }
      try {
        const allRecords = await getSchedulesByDate(date)
        // 按班次分组
        const grouped = {}
        for (const r of allRecords) {
          if (r.personId === personId) continue
          if (!grouped[r.shiftId]) grouped[r.shiftId] = []
          const p = await getPerson(r.personId)
          if (p) grouped[r.shiftId].push(p)
        }
        setColleagues(grouped)
      } catch { setColleagues(null) }
    })()
  }, [date, personId])
  const [showMemo, setShowMemo] = useState(false)
  const [savedMemo, setSavedMemo] = useState(null)
  const [memoContent, setMemoContent] = useState('')
  const [memoTime, setMemoTime] = useState('')

  const handleConfirm = () => {
    if (selectedId) { onSelect(selectedId) }
    onClose()
  }

  const handleSaveMemo = async () => {
    if (!memoContent.trim()) return
    let remindAt = null
    if (memoTime) remindAt = new Date(`${date}T${memoTime}:00`).getTime()
    try {
      const memo = await memoStore.addMemo({ date, content: memoContent.trim(), remindAt, isAlarm: !!memoTime })
      setSavedMemo(memo)
      setShowMemo(false)
      window.dispatchEvent(new CustomEvent('memo-changed'))
    } catch (err) {
      showToast('保存备注失败: ' + err.message, 'error')
    }
  }

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="absolute bottom-14 left-0 right-0 bg-white rounded-t-3xl shadow-2xl flex flex-col animate-slide-up max-h-[70vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 拖拽指示条 */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300/60" />
        </div>

        {/* 标题 + 同事 */}
        <div className="flex-shrink-0 px-5 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-base font-bold text-slate-800">{personName}</p>
              <p className="text-xs text-slate-400 mt-0.5">{date}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-slate-400 transition-colors">✕</button>
          </div>
          {colleagues && Object.keys(colleagues).length > 0 ? (
            <div className="space-y-1 mt-1.5 pt-2 border-t border-gray-50">
              <span className="text-[11px] text-slate-400">👥 同事排班</span>
              {Object.entries(colleagues).map(([shiftId, persons]) => {
                const shiftObj = shifts.find((s) => s.id === shiftId)
                return (
                  <div key={shiftId} className="flex items-center gap-1 flex-wrap">
                    {shiftObj && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded text-white font-medium" style={{ backgroundColor: shiftObj.color }}>
                        {shiftObj.shortName || shiftObj.name}
                      </span>
                    )}
                    {persons.map((p) => (
                      <span key={p.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-slate-600 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                        {p.name}
                      </span>
                    ))}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="mt-1.5 pt-2 border-t border-gray-50">
              <span className="text-xs text-slate-300">👥 当天无其他同事排班</span>
            </div>
          )}
        </div>

        {/* 班次列表 */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3 space-y-2">
          {shifts.map((shift) => {
            const isSelected = shift.id === selectedId
            const textColor = isLightColor(shift.color) ? 'text-gray-800' : 'text-white'
            return (
              <button
                key={shift.id}
                onClick={() => setSelectedId(isSelected ? null : shift.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-150 active:scale-[0.98]
                  ${isSelected ? 'shadow-md shadow-primary-200/30' : 'hover:bg-gray-50 border border-gray-100/80'}
                `}
                style={{ backgroundColor: isSelected ? shift.color : undefined, border: isSelected ? 'none' : undefined }}
              >
                <span className={`text-xl ${isSelected ? textColor : ''}`}>{shift.icon}</span>
                <div className="flex-1 text-left">
                  <p className={`text-sm font-semibold ${isSelected ? textColor : 'text-slate-700'}`}>
                    {shift.name} {isSelected && '✓'}
                  </p>
                  <p className={`text-xs ${isSelected ? `${textColor} opacity-80` : 'text-slate-400'}`}>
                    {shift.startTime ? `${shift.startTime} - ${shift.endTime}` : '全天'}
                  </p>
                </div>
                {!isSelected && <span className="w-3.5 h-3.5 rounded-full flex-shrink-0 ring-1 ring-gray-200" style={{ backgroundColor: shift.color }} />}
              </button>
            )
          })}
        </div>

        {/* 底部操作 */}
        <div className="flex-shrink-0 border-t border-gray-100 px-5 pt-3 pb-6 space-y-2.5">
          {/* 只有更改了班次时才显示确认按钮 */}
          {hasChanged || !currentShiftId ? (
            <button
              onClick={handleConfirm}
              disabled={!selectedId}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold text-center btn-primary disabled:opacity-40 shadow-lg shadow-primary-200/30"
            >
              {currentShiftId ? `✓ 改为${shifts.find(s => s.id === selectedId)?.name || ''}排班` : '✓ 确认排班'}
            </button>
          ) : (
            <button onClick={onClose}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold text-center bg-gray-100 text-slate-600 active:scale-[0.98] transition-all">
              已排班，点此关闭
            </button>
          )}
          {currentShiftId && !isCycleShift && (
            <button onClick={() => { onRemove(); onClose() }}
              className="w-full py-3 rounded-2xl text-sm font-medium text-rose-500 bg-rose-50/80 active:bg-rose-100 transition-colors">
              移除当前排班
            </button>
          )}
          {!showMemo && !savedMemo && (
            <button onClick={() => setShowMemo(true)}
              className="w-full py-2.5 rounded-2xl text-sm font-medium text-amber-600 bg-amber-50/60 active:bg-amber-100 transition-colors">
              📝 添加备注与提醒
            </button>
          )}
          {savedMemo && (
            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/60">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-amber-800 font-medium">{savedMemo.content}</p>
                  {savedMemo.remindAt && (
                    <p className="text-xs text-amber-500 mt-0.5">🔔 {new Date(savedMemo.remindAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</p>
                  )}
                </div>
                <button onClick={() => { setSavedMemo(null); setShowMemo(true) }} className="text-xs text-amber-500 underline flex-shrink-0">修改</button>
              </div>
            </div>
          )}
          {showMemo && (
            <div className="space-y-2.5 bg-gray-50/80 rounded-2xl p-3.5">
              <textarea value={memoContent} onChange={(e) => setMemoContent(e.target.value)} placeholder={`${date} 的备注...`}
                className="input-field" rows={2} autoFocus />
              <div className="flex items-center gap-2"><span className="text-xs text-slate-400">🔔</span>
                <input type="time" value={memoTime} onChange={(e) => setMemoTime(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white" />
                <span className="text-xs text-slate-400">提醒时间</span>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveMemo} disabled={!memoContent.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-amber-500 to-amber-400 text-white disabled:opacity-50 active:scale-[0.98] transition-all">保存备注</button>
                <button onClick={() => setShowMemo(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white text-slate-500 border border-gray-200 active:scale-[0.98] transition-all">取消</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { getAllShifts } from '../db/shiftStore'
import { today } from '../utils/date'

/**
 * 排班周期设置对话框
 * @param {Object} props
 * @param {string} props.personId
 * @param {string} props.personName
 * @param {Object} props.existingPattern - 已有周期模式
 * @param {Function} props.onSave - 保存回调 (patternData)
 * @param {Function} props.onDelete - 删除回调
 * @param {Function} props.onClose - 关闭回调
 */
export default function CycleDialog({
  personId,
  personName,
  existingPattern,
  onSave,
  onDelete,
  onClose,
}) {
  const [shifts, setShifts] = useState([])
  const [cycleDays, setCycleDays] = useState(existingPattern?.cycleDays || 7)
  const [pattern, setPattern] = useState(existingPattern?.pattern || [])
  const hasSelection = pattern.some((p) => p.shiftId)

  useEffect(() => {
    getAllShifts().then(setShifts)
  }, [])

  const handleSave = () => {
    if (!hasSelection) return

    onSave({
      personId,
      cycleDays,
      startDate: existingPattern?.startDate || today(),
      pattern: pattern.filter((p) => p.shiftId),
      title: `${personName}的排班周期`,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/30"
      onClick={onClose}
    >
      <div
        className="relative w-full bg-white rounded-t-2xl shadow-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 - 固定顶部 */}
        <div className="flex-shrink-0 border-b border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-700">
              🔁 排班周期设置
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-slate-400"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">{personName}</p>
        </div>

        {/* 可滚动内容区 */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3 space-y-3">
          {/* 周期天数 */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-2 block">
              周期长度（天）
            </label>
            <div className="flex gap-2 flex-wrap">
              {[3, 4, 5, 6, 7].map((n) => (
                <button
                  key={n}
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
                    cycleDays === n
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                  }`}
                >
                  {n}天
                </button>
              ))}
            </div>
          </div>

          {/* 周期模式列表 */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">
              点击选择班次，再点取消
            </p>
            <div className="space-y-1">
              {Array.from({ length: cycleDays }).map((_, i) => {
                const entry = pattern[i] || { dayOffset: i, shiftId: '' }

                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-50"
                  >
                    <span className="text-xs font-bold text-slate-500 w-10 flex-shrink-0 text-center">
                      D{i + 1}
                    </span>
                    <div className="flex-1 flex gap-1 overflow-x-auto">
                      {shifts.map((shift) => {
                        const isSelected = entry.shiftId === shift.id
                        return isSelected ? (
                          <button
                            key={shift.id}
                            onClick={() => {
                              const newPattern = [...pattern]
                              newPattern[i] = { dayOffset: i, shiftId: '' }
                              setPattern(newPattern)
                            }}
                            className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-medium text-white active:opacity-80"
                            style={{ backgroundColor: shift.color }}
                          >
                            {shift.icon}{shift.shortName || shift.name} ✕
                          </button>
                        ) : (
                          <button
                            key={shift.id}
                            onClick={() => {
                              const newPattern = [...pattern]
                              newPattern[i] = { dayOffset: i, shiftId: shift.id }
                              setPattern(newPattern)
                            }}
                            className="px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap bg-white border border-gray-200 text-slate-500 active:bg-gray-100"
                          >
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
        </div>

        {/* 操作按钮 - 固定底部 */}
        <div className="flex-shrink-0 border-t border-gray-100 px-5 py-4 bg-white rounded-b-2xl">
          <div className="flex gap-3 mb-2">
            <button
              onClick={handleSave}
              disabled={!hasSelection}
              className="flex-1 btn-primary text-sm py-3 text-center disabled:opacity-50"
            >
              ✓ 保存周期
            </button>
            <button
              onClick={onClose}
              className="btn-secondary text-sm py-3 flex-1 text-center"
            >
              取消
            </button>
          </div>
          {existingPattern && (
            <button
              onClick={() => {
                onDelete(personId)
                onClose()
              }}
              className="w-full py-2 text-xs text-red-400 underline underline-offset-2 text-center"
            >
              删除当前周期
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

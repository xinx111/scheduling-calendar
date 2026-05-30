import { useState, useEffect } from 'react'
import { getAllShifts } from '../db/shiftStore'
import ShiftBadge from './ShiftBadge'

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

  useEffect(() => {
    getAllShifts().then(setShifts)
  }, [])

  const handleSave = () => {
    const filteredPattern = pattern.filter((p) => p.shiftId)
    if (filteredPattern.length === 0) return

    onSave({
      personId,
      cycleDays,
      startDate: existingPattern?.startDate || new Date().toISOString().slice(0, 10),
      pattern: filteredPattern,
      title: `${personName}的排班周期`,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/30"
      onClick={onClose}
    >
      <div
        className="w-full bg-white rounded-t-2xl shadow-xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="sticky top-0 bg-white border-b border-gray-100 rounded-t-2xl px-5 py-4">
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

        <div className="p-5 space-y-4">
          {/* 周期天数 */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">
              周期长度（天）
            </label>
            <div className="flex gap-2">
              {[3, 5, 6, 7, 10, 14].map((n) => (
                <button
                  key={n}
                  onClick={() => setCycleDays(n)}
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

          {/* 模式设置说明 */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">
              每个位置选择对应班次（留空 = 不排班）
            </p>
          </div>

          {/* 周期模式列表 */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {Array.from({ length: cycleDays }).map((_, i) => {
              const entry = pattern[i] || { dayOffset: i, shiftId: '' }
              const selectedShift = shifts.find((s) => s.id === entry.shiftId)

              return (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
                >
                  <span className="text-xs font-bold text-slate-500 w-14 flex-shrink-0">
                    第{i + 1}天
                  </span>
                  <div className="flex-1 flex gap-1 overflow-x-auto">
                    {shifts.map((shift) => (
                      <button
                        key={shift.id}
                        onClick={() => {
                          const newPattern = [...pattern]
                          newPattern[i] = {
                            dayOffset: i,
                            shiftId:
                              entry.shiftId === shift.id ? '' : shift.id,
                          }
                          setPattern(newPattern)
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                          entry.shiftId === shift.id
                            ? 'ring-2 ring-primary-500 scale-105'
                            : 'bg-white border border-gray-200 text-slate-500'
                        }`}
                        style={
                          entry.shiftId === shift.id
                            ? {
                                backgroundColor: shift.color,
                                color: 'white',
                              }
                            : {}
                        }
                      >
                        {shift.icon} {shift.shortName || shift.name}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 当前设置预览 */}
          {pattern.some((p) => p.shiftId) && (
            <div className="p-3 rounded-xl bg-primary-50 border border-primary-100">
              <p className="text-xs font-medium text-primary-700 mb-1">
                周期预览
              </p>
              <div className="flex flex-wrap gap-1">
                {pattern
                  .filter((p) => p.shiftId)
                  .map((p) => {
                    const shift = shifts.find((s) => s.id === p.shiftId)
                    return shift ? (
                      <ShiftBadge key={p.dayOffset} shift={shift} size="sm" />
                    ) : null
                  })}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={!pattern.some((p) => p.shiftId)}
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
              className="w-full py-2 text-xs text-red-400 underline underline-offset-2"
            >
              删除当前周期
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { isLightColor } from '../utils/color'
import * as memoStore from '../db/memoStore'
import { showToast } from './Toast'

/**
 * 班次选择器（底部弹出面板，带备注/提醒功能）
 */
export default function ShiftPicker({
  shifts,
  currentShiftId,
  date,
  personName,
  onSelect,
  onRemove,
  onClose,
}) {
  const [selectedId, setSelectedId] = useState(currentShiftId)

  // 备注状态
  const [showMemo, setShowMemo] = useState(false)
  const [savedMemo, setSavedMemo] = useState(null)
  const [memoContent, setMemoContent] = useState('')
  const [memoTime, setMemoTime] = useState('')

  const handleConfirm = () => {
    if (selectedId) {
      onSelect(selectedId)
    }
    onClose()
  }

  const handleSaveMemo = async () => {
    if (!memoContent.trim()) return

    let remindAt = null
    if (memoTime) {
      remindAt = new Date(`${date}T${memoTime}:00`).getTime()
    }

    try {
      const memo = await memoStore.addMemo({
        date,
        content: memoContent.trim(),
        remindAt,
        isAlarm: !!memoTime,
      })
      setSavedMemo(memo)
      setShowMemo(false)
      window.dispatchEvent(new CustomEvent('memo-changed'))
    } catch (err) {
      showToast('保存备注失败: ' + err.message, 'error')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end bg-black/30"
      onClick={onClose}
    >
      <div
        className="w-full bg-white rounded-t-2xl shadow-xl flex flex-col"
        style={{ maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex-shrink-0 border-b border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-700">{personName}</p>
              <p className="text-xs text-slate-400 mt-0.5">{date}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-slate-400"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 班次列表 */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-2">
          {shifts.map((shift) => {
            const isSelected = shift.id === selectedId
            const textColor = isLightColor(shift.color)
              ? 'text-gray-800'
              : 'text-white'

            return (
              <button
                key={shift.id}
                onClick={() => setSelectedId(isSelected ? null : shift.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl
                  transition-all duration-100 active:scale-[0.98]
                  ${isSelected
                    ? 'ring-2 ring-primary-500 shadow-md'
                    : 'hover:bg-gray-50'
                  }
                `}
                style={{
                  backgroundColor: isSelected ? shift.color : undefined,
                  border: isSelected ? 'none' : '1px solid #E2E8F0',
                }}
              >
                <span className={`text-xl ${isSelected ? textColor : ''}`}>
                  {shift.icon}
                </span>
                <div className="flex-1 text-left">
                  <p className={`text-sm font-medium ${isSelected ? textColor : 'text-slate-700'}`}>
                    {shift.name}
                    {isSelected && ' ✓'}
                  </p>
                  <p className={`text-xs ${isSelected ? textColor + ' opacity-80' : 'text-slate-400'}`}>
                    {shift.startTime ? `${shift.startTime} - ${shift.endTime}` : '全天'}
                  </p>
                </div>
                {!isSelected && (
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: shift.color }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* 底部操作 */}
        <div className="flex-shrink-0 border-t border-gray-100 px-5 py-4 space-y-2">
          <button
            onClick={handleConfirm}
            disabled={!selectedId}
            className="w-full py-3 rounded-xl text-sm font-medium text-center btn-primary disabled:opacity-50"
          >
            ✓ 确认排班
          </button>

          {currentShiftId && (
            <button
              onClick={() => {
                onRemove()
                onClose()
              }}
              className="w-full py-3 rounded-xl text-sm font-medium text-red-500 bg-red-50 active:bg-red-100 transition-colors"
            >
              移除当前排班
            </button>
          )}

          {/* 备注/提醒 */}
          {!showMemo && !savedMemo && (
            <button
              onClick={() => setShowMemo(true)}
              className="w-full py-3 rounded-xl text-sm font-medium text-amber-600 bg-amber-50 active:bg-amber-100 transition-colors"
            >
              📝 添加备注与提醒
            </button>
          )}

          {/* 已保存的备注 */}
          {savedMemo && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-amber-800">{savedMemo.content}</p>
                  {savedMemo.remindAt && (
                    <p className="text-xs text-amber-500 mt-0.5">
                      🔔 {new Date(savedMemo.remindAt).toLocaleTimeString('zh-CN', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => { setSavedMemo(null); setShowMemo(true) }}
                  className="text-xs text-amber-500 underline flex-shrink-0"
                >
                  修改
                </button>
              </div>
            </div>
          )}

          {/* 备注表单 */}
          {showMemo && (
            <div className="space-y-2">
              <textarea
                value={memoContent}
                onChange={(e) => setMemoContent(e.target.value)}
                placeholder={`${date} 的备注...`}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-200"
                rows={2}
                autoFocus
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">🔔</span>
                <input
                  type="time"
                  value={memoTime}
                  onChange={(e) => setMemoTime(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none flex-1"
                />
                <span className="text-xs text-slate-400">提醒时间（可选）</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveMemo}
                  disabled={!memoContent.trim()}
                  className="flex-1 py-2 rounded-xl text-sm font-medium bg-amber-500 text-white disabled:opacity-50 active:scale-95 transition-all"
                >
                  保存备注
                </button>
                <button
                  onClick={() => setShowMemo(false)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium bg-gray-100 text-slate-500 active:scale-95 transition-all"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-medium text-slate-400 bg-gray-50 active:bg-gray-100 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}

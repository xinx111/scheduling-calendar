import { useState } from 'react'
import { isLightColor } from '../utils/color'

/**
 * 班次选择器（底部弹出面板，需点击确认才保存）
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
  // 本地暂存选中状态，确认后再保存
  const [selectedId, setSelectedId] = useState(currentShiftId)

  const handleConfirm = () => {
    if (selectedId) {
      onSelect(selectedId)
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/30"
      onClick={onClose}
    >
      <div
        className="w-full bg-white rounded-t-2xl shadow-xl flex flex-col"
        style={{ maxHeight: '75vh' }}
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
                onClick={() => {
                  // 点同一个取消选中，点别的切换
                  setSelectedId(isSelected ? null : shift.id)
                }}
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

import { isLightColor } from '../utils/color'

/**
 * 班次选择器（底部弹出面板）
 * @param {Object} props
 * @param {Array} props.shifts - 所有班次模板
 * @param {string|null} props.currentShiftId - 当前已选班次 ID
 * @param {string} props.date - 当前日期 YYYY-MM-DD
 * @param {string} props.personName - 当前人员姓名
 * @param {Function} props.onSelect - 选择班次回调 (shiftId)
 * @param {Function} props.onRemove - 移除排班回调
 * @param {Function} props.onClose - 关闭面板回调
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
  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/30"
      onClick={onClose}
    >
      <div
        className="w-full bg-white rounded-t-2xl shadow-xl max-h-[70vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="sticky top-0 bg-white border-b border-gray-100 rounded-t-2xl px-5 py-4">
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
        <div className="p-5 space-y-2">
          {shifts.map((shift) => {
            const isSelected = shift.id === currentShiftId
            const textColor = isLightColor(shift.color)
              ? 'text-gray-800'
              : 'text-white'

            return (
              <button
                key={shift.id}
                onClick={() => onSelect(shift.id)}
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
                {/* 图标 */}
                <span className={`text-xl ${isSelected ? textColor : ''}`}>
                  {shift.icon}
                </span>

                {/* 班次信息 */}
                <div className="flex-1 text-left">
                  <p
                    className={`text-sm font-medium ${
                      isSelected ? textColor : 'text-slate-700'
                    }`}
                  >
                    {shift.name}
                    {isSelected && ' ✓'}
                  </p>
                  <p
                    className={`text-xs ${
                      isSelected
                        ? textColor + ' opacity-80'
                        : 'text-slate-400'
                    }`}
                  >
                    {shift.startTime
                      ? `${shift.startTime} - ${shift.endTime}`
                      : '全天'}
                  </p>
                </div>

                {/* 色块指示器 */}
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
        <div className="px-5 pb-6 space-y-2">
          {currentShiftId && (
            <button
              onClick={onRemove}
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

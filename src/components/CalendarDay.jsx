import { isLightColor } from '../utils/color'
import { getWeekdayName } from '../utils/date'

/**
 * 日历单日格子组件
 */
export default function CalendarDay({
  day,
  shift,
  colleagueCount = 0,
  colleagueNames = [],
  hasMemo = false,
  isCycle = false,
  isSelected = false,
  onClick,
}) {
  const isWeekend =
    getWeekdayName(day.date) === '六' || getWeekdayName(day.date) === '日'

  // 当日班次的颜色块
  const shiftColor = shift?.color || null
  const shiftTextColor = shiftColor ? (isLightColor(shiftColor) ? 'text-gray-800' : 'text-white') : ''

  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center rounded-lg py-1.5 min-h-[60px]
        transition-all duration-100 active:scale-95
        ${!day.isCurrentMonth ? 'opacity-30' : ''}
        ${isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:bg-gray-100'}
        ${isCycle ? 'ring-1 ring-amber-300 ring-dashed' : ''}
      `}
    >
      {/* 日期数字 */}
      <span
        className={`text-xs font-medium mb-0.5 ${
          day.isToday
            ? 'bg-primary-600 text-white w-5 h-5 rounded-full flex items-center justify-center'
            : isWeekend
            ? 'text-red-400'
            : 'text-slate-600'
        }`}
      >
        {day.day}
      </span>

      {/* 班次标签 */}
      {shift && (
        <span
          className={`text-[10px] leading-tight px-1.5 py-0.5 rounded-full font-medium truncate max-w-full ${shiftTextColor} ${
            isCycle ? 'ring-1 ring-inset ring-white/50' : ''
          }`}
          style={{ backgroundColor: shiftColor }}
        >
          {shift.shortName || shift.name}
        </span>
      )}

      {/* 同班同事 */}
      {colleagueCount > 0 && (
        <div className="flex items-center gap-0.5 mt-0.5 max-w-full overflow-hidden">
          <span className="text-[10px] text-slate-400 flex-shrink-0">
            👥
          </span>
          <span className="text-[9px] text-slate-400 truncate">
            {colleagueNames.slice(0, 2).join('、')}
            {colleagueCount > 2 && ` +${colleagueCount - 2}`}
          </span>
        </div>
      )}

      {/* 备注标记 */}
      {hasMemo && !shift && (
        <span className="text-[10px] mt-0.5">📝</span>
      )}

      {/* 周期标记小点 */}
      {isCycle && !hasMemo && !colleagueCount && (
        <span className="text-[8px] text-amber-400 mt-0.5">↻</span>
      )}
    </button>
  )
}

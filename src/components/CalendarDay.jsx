import { isLightColor } from '../utils/color'
import { getWeekdayName } from '../utils/date'

export default function CalendarDay({
  day,
  shift,
  hasMemo = false,
  isCycle = false,
  isSelected = false,
  onClick,
}) {
  const isWeekend =
    getWeekdayName(day.date) === '六' || getWeekdayName(day.date) === '日'

  const shiftColor = shift?.color || null
  const shiftTextColor = shiftColor ? (isLightColor(shiftColor) ? 'text-gray-800' : 'text-white') : ''

  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center rounded-xl py-1.5 min-h-[58px]
        transition-all duration-150 active:scale-90 select-none
        ${!day.isCurrentMonth ? 'opacity-20 pointer-events-none' : ''}
        ${
          isSelected
            ? 'ring-2 ring-primary-500 bg-primary-50 shadow-sm shadow-primary-200/50'
            : 'hover:bg-gray-100/70'
        }
        ${isCycle && !shift ? 'ring-1 ring-amber-200/60 bg-amber-50/30' : ''}
      `}
    >
      {/* 日期数字 */}
      <span
        className={`
          text-xs font-semibold mb-0.5 flex items-center justify-center
          ${day.isToday
            ? 'bg-gradient-to-br from-primary-500 to-primary-700 text-white w-6 h-6 rounded-full shadow-sm shadow-primary-300/50 text-[11px]'
            : isWeekend
            ? 'text-rose-400'
            : 'text-slate-600'
          }
        `}
        style={day.isToday ? {} : { width: '24px', height: '24px' }}
      >
        {day.day}
      </span>

      {/* 班次标签 */}
      {shift && (
        <span
          className={`
            text-[10px] leading-tight px-1.5 py-0.5 rounded-full font-medium truncate max-w-full
            ${shiftTextColor}
            ${isCycle && !isSelected ? 'ring-1 ring-inset ring-white/40' : ''}
          `}
          style={{ backgroundColor: shiftColor }}
        >
          {shift.shortName || shift.name}
        </span>
      )}

      {/* 备注标记 */}
      {hasMemo && (
        <span className="text-[9px] mt-0.5">📝</span>
      )}

      {/* 周期标记 */}
      {isCycle && !hasMemo && !shift && (
        <span className="text-[9px] text-amber-400 mt-0.5">↻</span>
      )}
    </button>
  )
}

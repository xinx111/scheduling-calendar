import { getHolidayInfo } from '../utils/holidays.js'

export default function CalendarDay({
  day,
  shift,
  hasMemo = false,
  isCycle = false,
  isSelected = false,
  onClick,
}) {
  const shiftColor = shift?.color || null
  const holiday = getHolidayInfo(day.date)

  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center rounded-xl py-1.5 min-h-[56px]
        transition-all duration-150 active:scale-90 select-none
        ${!day.isCurrentMonth ? 'opacity-20 pointer-events-none' : ''}
        ${isSelected ? 'ring-2 ring-primary-500 shadow-sm shadow-primary-200/50' : ''}
        ${
          shiftColor && day.isCurrentMonth
            ? 'shadow-sm hover:brightness-95'
            : 'hover:bg-gray-100/70'
        }
        ${isCycle && !shift ? 'ring-1 ring-amber-300/50 bg-amber-50/30' : ''}
      `}
      style={
        shiftColor && day.isCurrentMonth
          ? { backgroundColor: `${shiftColor}33`, borderLeft: `3px solid ${shiftColor}` }
          : {}
      }
    >
      {/* 日期数字 */}
      <span
        className={`
          flex items-center justify-center font-semibold text-slate-800
          ${day.isToday
            ? 'bg-gradient-to-br from-primary-500 to-primary-700 text-white w-6 h-6 rounded-full shadow-sm shadow-primary-300/50 text-[11px]'
            : holiday && !holiday.isWorkday
              ? 'text-rose-500 text-xs'
              : 'text-xs'
          }
        `}
        style={
          day.isToday
            ? {}
            : { width: '24px', height: '24px' }
        }
      >
        {day.day}
      </span>

      {/* 班次标签 - 使用班次同色系文字 */}
      {shift && shiftColor && (
        <span
          className="text-[10px] leading-tight font-semibold mt-0.5"
          style={{ color: shiftColor }}
        >
          {shift.shortName || shift.name}
        </span>
      )}
      {shift && !shiftColor && (
        <span className="text-[10px] leading-tight font-semibold mt-0.5 text-slate-600">
          {shift.shortName || shift.name}
        </span>
      )}

      {/* 底部小标记行 */}
      <div className="flex items-center gap-0.5 mt-0.5 min-h-[14px]">
        {holiday && !holiday.isWorkday && (
          <span className="text-[8px] text-rose-400 font-semibold leading-none truncate">
            {holiday.name}
          </span>
        )}
        {holiday && holiday.isWorkday && (
          <span className="text-[8px] font-bold text-amber-600 bg-amber-50 border border-amber-200/60 rounded px-0.5 leading-tight">
            班
          </span>
        )}
        {hasMemo && <span className="text-[9px]">📝</span>}
        {isCycle && !hasMemo && !shift && (
          <span className="text-[9px] text-amber-400">↻</span>
        )}
      </div>
    </button>
  )
}

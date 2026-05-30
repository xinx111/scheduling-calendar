import CalendarDay from './CalendarDay'
import { WEEKDAY_NAMES } from '../constants'

export default function CalendarGrid({
  grid,
  schedulesMap = {},
  selectedDate,
  onDateClick,
}) {
  return (
    <div className="select-none">
      {/* 星期表头 */}
      <div className="grid grid-cols-7 mb-1.5">
        {WEEKDAY_NAMES.map((name, i) => (
          <div
            key={i}
            className={`text-center text-xs font-semibold py-2 ${
              i === 0 || i === 6 ? 'text-rose-400' : 'text-slate-400'
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className="grid grid-cols-7 gap-[3px]">
        {grid.map((day, index) => {
          const dayData = schedulesMap[day.date]
          return (
            <CalendarDay
              key={day.date + index}
              day={day}
              shift={dayData?.shift}
              hasMemo={dayData?.hasMemo}
              isCycle={dayData?.isCycle}
              isSelected={day.date === selectedDate}
              onClick={() => onDateClick(day.date)}
            />
          )
        })}
      </div>
    </div>
  )
}

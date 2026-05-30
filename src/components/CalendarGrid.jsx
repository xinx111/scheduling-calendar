import CalendarDay from './CalendarDay'
import { WEEKDAY_NAMES } from '../constants'

/**
 * 日历网格组件
 * @param {Array} grid - 日历网格数据（from useCalendar）
 * @param {Object} schedulesMap - { "2026-05-25": { shift, colleagues } }
 * @param {string} selectedDate - 选中日期
 * @param {Function} onDateClick - 日期点击回调
 */
export default function CalendarGrid({
  grid,
  schedulesMap = {},
  selectedDate,
  onDateClick,
}) {
  return (
    <div className="select-none">
      {/* 星期表头 */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_NAMES.map((name, i) => (
          <div
            key={i}
            className={`text-center text-xs font-medium py-2 ${
              i === 0 || i === 6 ? 'text-red-400' : 'text-slate-400'
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className="grid grid-cols-7 gap-1">
        {grid.map((day, index) => {
          const dayData = schedulesMap[day.date]
          return (
            <CalendarDay
              key={day.date + index}
              day={day}
              shift={dayData?.shift}
              colleagueCount={dayData?.colleagues?.length || 0}
              hasMemo={dayData?.hasMemo}
              isSelected={day.date === selectedDate}
              onClick={() => onDateClick(day.date)}
            />
          )
        })}
      </div>
    </div>
  )
}

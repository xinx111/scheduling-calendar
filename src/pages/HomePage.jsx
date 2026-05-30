import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePersons } from '../hooks/usePersons'
import { useCalendar } from '../hooks/useCalendar'
import PersonSelector from '../components/PersonSelector'
import CalendarGrid from '../components/CalendarGrid'
import { getWeekRange, today as getToday } from '../utils/date'
import { getPersonSchedulesInRange } from '../db/scheduleStore'
import { getShift } from '../db/shiftStore'
import { getMemosByDate } from '../db/memoStore'

export default function HomePage() {
  const navigate = useNavigate()
  const { activePersons, loading: personsLoading } = usePersons()
  const calendar = useCalendar()
  const [selectedPersonId, setSelectedPersonId] = useState(null)
  const [schedulesMap, setSchedulesMap] = useState({})
  const [dataLoading, setDataLoading] = useState(false)

  // 默认选中第一个活跃人员
  useEffect(() => {
    if (activePersons.length > 0 && !selectedPersonId) {
      setSelectedPersonId(activePersons[0].id)
    }
  }, [activePersons, selectedPersonId])

  // 当选中人员或月份变化时加载排班数据
  useEffect(() => {
    if (!selectedPersonId) return

    const loadSchedules = async () => {
      setDataLoading(true)
      const startDate = `${calendar.year}-${String(calendar.month).padStart(2, '0')}-01`
      const lastDay = new Date(calendar.year, calendar.month, 0).getDate()
      const endDate = `${calendar.year}-${String(calendar.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      const records = await getPersonSchedulesInRange(
        selectedPersonId,
        startDate,
        endDate
      )

      const map = {}
      for (const record of records) {
        const shift = await getShift(record.shiftId)
        map[record.date] = { record, shift, colleagues: [] }
      }

      // 检查日期是否有备注
      const today = getToday()
      const todayMemos = await getMemosByDate(today)
      if (todayMemos.length > 0) {
        if (!map[today]) {
          map[today] = { shift: null, colleagues: [], hasMemo: true }
        } else {
          map[today].hasMemo = true
        }
      }

      setSchedulesMap(map)
      setDataLoading(false)
    }

    loadSchedules()
  }, [selectedPersonId, calendar.year, calendar.month])

  const weekRange = getWeekRange(new Date())

  if (personsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 周次信息 */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={calendar.goToPrevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-90 transition-all"
            >
              ←
            </button>
            <h2 className="text-base font-bold text-slate-700">
              {calendar.title}
            </h2>
            <button
              onClick={calendar.goToNextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-90 transition-all"
            >
              →
            </button>
          </div>
          <button
            onClick={calendar.goToToday}
            className="text-xs text-primary-600 font-medium px-3 py-1 rounded-full bg-primary-50 active:bg-primary-100"
          >
            今天
          </button>
        </div>

        {/* 人员选择 */}
        <PersonSelector
          persons={activePersons}
          selectedId={selectedPersonId}
          onSelect={setSelectedPersonId}
        />

        {/* 日历 */}
        {dataLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-6 h-6 border-3 border-primary-200 border-t-primary-600 rounded-full" />
          </div>
        ) : (
          <CalendarGrid
            grid={calendar.grid}
            schedulesMap={schedulesMap}
            selectedDate={getToday()}
            onDateClick={(date) => navigate(`/day/${date}`)}
          />
        )}
      </div>

      {/* 本周快速概览 */}
      <div className="card">
        <h3 className="text-sm font-bold text-slate-600 mb-2">
          📋 本周排班 ({weekRange.weekStart} ~ {weekRange.weekEnd})
        </h3>
        <p className="text-xs text-slate-400">
          点击日历中的日期查看详细排班和同班同事
        </p>
      </div>

      {/* 快速操作 */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/upload')}
          className="flex-1 btn-primary text-center"
        >
          📷 拍照识别排班
        </button>
        <button
          onClick={() => navigate('/calendar')}
          className="flex-1 btn-secondary text-center"
        >
          📅 完整月视图
        </button>
      </div>
    </div>
  )
}

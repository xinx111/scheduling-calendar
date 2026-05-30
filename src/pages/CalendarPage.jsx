import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePersons } from '../hooks/usePersons'
import { useCalendar } from '../hooks/useCalendar'
import PersonSelector from '../components/PersonSelector'
import CalendarGrid from '../components/CalendarGrid'
import { getPersonSchedulesInRange } from '../db/scheduleStore'
import { getShift } from '../db/shiftStore'
import { getMemosInRange } from '../db/memoStore'
import { today as getToday } from '../utils/date'

export default function CalendarPage() {
  const navigate = useNavigate()
  const { activePersons, persons } = usePersons()
  const calendar = useCalendar()
  const [selectedPersonId, setSelectedPersonId] = useState(null)
  const [schedulesMap, setSchedulesMap] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (activePersons.length > 0 && !selectedPersonId) {
      setSelectedPersonId(activePersons[0].id)
    }
  }, [activePersons, selectedPersonId])

  useEffect(() => {
    if (!selectedPersonId) return

    const load = async () => {
      setLoading(true)
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
        map[record.date] = { record, shift, colleagues: [], hasMemo: false }
      }

      // 加载当月所有备注标记
      const memos = await getMemosInRange(startDate, endDate)
      const memoDateSet = new Set(memos.map((m) => m.date))
      for (const date of memoDateSet) {
        if (!map[date]) {
          map[date] = { shift: null, colleagues: [], hasMemo: true }
        } else {
          map[date].hasMemo = true
        }
      }

      setSchedulesMap(map)
      setLoading(false)
    }

    load()
  }, [selectedPersonId, calendar.year, calendar.month])

  const today = getToday()

  return (
    <div>
      {/* 月份导航 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={calendar.goToPrevMonth}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-90 transition-all text-lg"
        >
          ‹
        </button>
        <h2 className="text-lg font-bold text-slate-700">{calendar.title}</h2>
        <button
          onClick={calendar.goToNextMonth}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-90 transition-all text-lg"
        >
          ›
        </button>
      </div>

      {/* 人员选择 */}
      <PersonSelector
        persons={activePersons}
        selectedId={selectedPersonId}
        onSelect={setSelectedPersonId}
      />

      {/* 日历 */}
      <div className="card mt-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full" />
          </div>
        ) : (
          <CalendarGrid
            grid={calendar.grid}
            schedulesMap={schedulesMap}
            selectedDate={today}
            onDateClick={(date) => navigate(`/day/${date}`)}
          />
        )}
      </div>
    </div>
  )
}

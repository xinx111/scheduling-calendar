import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ToastContainer from './components/Toast'
import HomePage from './pages/HomePage'
import CalendarPage from './pages/CalendarPage'
import DayDetailPage from './pages/DayDetailPage'
import PersonDetailPage from './pages/PersonDetailPage'
import PeoplePage from './pages/PeoplePage'
import SettingsPage from './pages/SettingsPage'
import RemindersPage from './pages/RemindersPage'
import { scheduleAllPending, checkWebReminders, ensureReminderChannel } from './notifications'

export default function App() {
  useEffect(() => {
    ensureReminderChannel()
    scheduleAllPending()
    const timer = setInterval(checkWebReminders, 30000)
    return () => clearInterval(timer)
  }, [])

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/day/:date" element={<DayDetailPage />} />
          <Route path="/person/:personId" element={<PersonDetailPage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/reminders" element={<RemindersPage />} />
        </Route>
      </Routes>
    </>
  )
}

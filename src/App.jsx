import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ToastContainer from './components/Toast'
import HomePage from './pages/HomePage'
import DayDetailPage from './pages/DayDetailPage'
import PeoplePage from './pages/PeoplePage'
import SettingsPage from './pages/SettingsPage'
import RemindersPage from './pages/RemindersPage'

export default function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/day/:date" element={<DayDetailPage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/reminders" element={<RemindersPage />} />
        </Route>
      </Routes>
    </>
  )
}

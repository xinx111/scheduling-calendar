import { Outlet, NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '../constants'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="top-bar flex items-center justify-between">
        <h1 className="text-lg font-bold text-primary-600">排班日历</h1>
        <NavLink
          to="/settings"
          className="text-slate-500 active:text-primary-600 transition-colors p-1"
        >
          ⚙️
        </NavLink>
      </header>

      {/* 页面内容 */}
      <main className="page-content">
        <Outlet />
      </main>

      {/* 底部导航 */}
      <nav className="bottom-nav">
        <div className="flex items-center justify-around py-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
                  isActive
                    ? 'text-primary-600 font-medium'
                    : 'text-slate-400'
                }`
              }
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

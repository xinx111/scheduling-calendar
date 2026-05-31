import { Outlet, NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '../constants'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100/60">
      {/* 顶部导航栏 */}
      <header className="top-bar flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">📅</span>
          <div>
            <h1 className="text-[17px] font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
              排班日历
            </h1>
            <p className="text-[10px] text-slate-400 -mt-0.5">排班管理 · 一目了然</p>
          </div>
        </div>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 ${
              isActive
                ? 'bg-primary-50 text-primary-600'
                : 'text-slate-400 hover:bg-gray-100 hover:text-slate-600'
            }`
          }
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </NavLink>
      </header>

      {/* 页面内容 */}
      <main className="page-content">
        <div className="max-w-lg mx-auto">
          <Outlet />
        </div>
      </main>

      {/* 底部导航 */}
      <nav className="bottom-nav">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-around py-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-4 py-2 text-xs transition-all duration-200 relative ${
                    isActive
                      ? 'text-primary-600'
                      : 'text-slate-400 hover:text-slate-500'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-primary-500 rounded-full" />
                    )}
                    <span className={`text-xl ${isActive ? 'scale-110' : ''} transition-transform duration-200`}>
                      {item.icon}
                    </span>
                    <span className={`font-medium ${isActive ? 'text-[11px]' : 'text-[10px]'}`}>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </div>
  )
}

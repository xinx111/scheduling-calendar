import { useState, useEffect, useCallback, useRef } from 'react'

let toastId = 0

export function showToast(message, type = 'success', duration = 2000) {
  const event = new CustomEvent('show-toast', {
    detail: { id: ++toastId, message, type, duration },
  })
  window.dispatchEvent(event)
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef({})

  const addToast = useCallback((detail) => {
    setToasts((prev) => [...prev, { ...detail, entering: true }])
    // 在消失前 300ms 开始淡出动画
    const hideDelay = Math.max(0, (detail.duration || 2000) - 300)
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => t.id === detail.id ? { ...t, entering: false } : t))
    }, hideDelay)
    const timerId = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== detail.id))
      delete timersRef.current[detail.id]
    }, detail.duration || 2000)
    timersRef.current[detail.id] = timerId
  }, [])

  useEffect(() => {
    const handler = (e) => addToast(e.detail)
    window.addEventListener('show-toast', handler)
    return () => {
      window.removeEventListener('show-toast', handler)
      Object.values(timersRef.current).forEach(clearTimeout)
      timersRef.current = {}
    }
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            px-5 py-2.5 rounded-2xl shadow-lg text-sm font-medium pointer-events-auto
            transition-all duration-300 ease-out
            ${toast.entering !== false ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'}
            ${
              toast.type === 'success'
                ? 'bg-emerald-500 text-white shadow-emerald-200/40'
                : toast.type === 'error'
                ? 'bg-rose-500 text-white shadow-rose-200/40'
                : toast.type === 'warning'
                ? 'bg-amber-500 text-white shadow-amber-200/40'
                : 'bg-slate-800 text-white shadow-slate-200/40'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <span>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : toast.type === 'warning' ? '⚠' : 'ℹ'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

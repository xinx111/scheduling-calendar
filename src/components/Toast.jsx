import { useState, useEffect, useCallback } from 'react'

/**
 * Toast 提示组件
 */
let toastId = 0

export function showToast(message, type = 'success', duration = 2000) {
  const event = new CustomEvent('show-toast', {
    detail: { id: ++toastId, message, type, duration },
  })
  window.dispatchEvent(event)
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((detail) => {
    setToasts((prev) => [...prev, detail])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== detail.id))
    }, detail.duration || 2000)
  }, [])

  useEffect(() => {
    const handler = (e) => addToast(e.detail)
    window.addEventListener('show-toast', handler)
    return () => window.removeEventListener('show-toast', handler)
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            px-4 py-2 rounded-xl shadow-lg text-sm font-medium animate-fade-in
            ${
              toast.type === 'success'
                ? 'bg-green-500 text-white'
                : toast.type === 'error'
                ? 'bg-red-500 text-white'
                : toast.type === 'warning'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-800 text-white'
            }
          `}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}

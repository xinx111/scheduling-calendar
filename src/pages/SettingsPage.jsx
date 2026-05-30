import { useState, useEffect } from 'react'
import { getAllShifts } from '../db/shiftStore'
import { showToast } from '../components/Toast'
import { isLightColor } from '../utils/color'

export default function SettingsPage() {
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const all = await getAllShifts()
      setShifts(all)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-700">⚙️ 设置</h2>

      {/* 班次管理 */}
      <div className="card">
        <h3 className="text-sm font-bold text-slate-600 mb-3">
          🏷️ 班次管理
        </h3>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin w-6 h-6 border-3 border-primary-200 border-t-primary-600 rounded-full" />
          </div>
        ) : (
          <div className="space-y-2">
            {shifts.map((shift) => (
              <div
                key={shift.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ backgroundColor: shift.color + '15' }}
              >
                <span className="text-xl">{shift.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">
                    {shift.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {shift.startTime
                      ? `${shift.startTime} - ${shift.endTime}`
                      : '全天'}
                    {shift.isDefault ? ' · 预置' : ' · 自定义'}
                  </p>
                </div>
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: shift.color }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 数据管理 */}
      <div className="card">
        <h3 className="text-sm font-bold text-slate-600 mb-3">💾 数据管理</h3>
        <p className="text-xs text-slate-400 mb-3">
          所有数据存储在浏览器本地，清除浏览器缓存会导致数据丢失。
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              showToast('数据导出（待实现）')
            }}
            className="flex-1 btn-secondary text-sm py-2 text-center"
          >
            导出数据
          </button>
          <button
            onClick={() => {
              if (window.confirm('确定要清除所有数据？此操作不可恢复！')) {
                import('../db/index').then(({ resetDB }) =>
                  resetDB().then(() => {
                    showToast('数据已重置')
                    window.location.reload()
                  })
                )
              }
            }}
            className="flex-1 bg-red-50 text-red-500 border border-red-200 px-4 py-2 rounded-xl text-sm font-medium active:scale-95 transition-all"
          >
            清除数据
          </button>
        </div>
      </div>

      {/* API 配置 */}
      <div className="card">
        <h3 className="text-sm font-bold text-slate-600 mb-3">
          🔑 智谱 API 配置
        </h3>
        <p className="text-xs text-slate-400">
          在项目根目录的 .env 文件中设置：
        </p>
        <code className="block mt-2 px-3 py-2 bg-gray-50 rounded-xl text-xs text-slate-600 font-mono">
          VITE_ZHIPU_API_KEY=your_api_key_here
        </code>
        <p className="text-xs text-slate-400 mt-2">
          获取 API Key：bigmodel.cn
        </p>
      </div>

      {/* 关于 */}
      <div className="card text-center py-4">
        <h3 className="text-sm font-bold text-slate-600">排班日历</h3>
        <p className="text-xs text-slate-400 mt-1">v1.0.0</p>
        <p className="text-xs text-slate-400 mt-0.5">
          拍照识别 · 人员排班 · 日历来查看 · 闹钟提醒
        </p>
      </div>
    </div>
  )
}

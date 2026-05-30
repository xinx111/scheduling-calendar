import { useState, useEffect } from 'react'
import { getAllShifts, addShift, deleteShift } from '../db/shiftStore'
import { getDB } from '../db/index'
import { showToast } from '../components/Toast'

function hexToRgba(hex, alpha = 0.15) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function SettingsPage() {
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)

  // 添加班次表单
  const [showAddForm, setShowAddForm] = useState(false)
  const [newShift, setNewShift] = useState({
    name: '',
    shortName: '',
    startTime: '09:00',
    endTime: '18:00',
    color: '#6366F1',
    icon: '📋',
  })

  // 预置颜色选项
  const colorOptions = [
    '#F59E0B', '#3B82F6', '#6366F1', '#EF4444',
    '#10B981', '#EC4899', '#F97316', '#8B5CF6',
    '#14B8A6', '#84CC16', '#06B6D4', '#EAB308',
  ]

  const loadShifts = async () => {
    const all = await getAllShifts()
    setShifts(all)
    setLoading(false)
  }

  useEffect(() => {
    loadShifts()
  }, [])

  const handleAddShift = async () => {
    if (!newShift.name.trim()) {
      showToast('请输入班次名称', 'warning')
      return
    }
    try {
      await addShift({
        ...newShift,
        shortName: newShift.shortName || newShift.name.charAt(0),
      })
      showToast(`已添加「${newShift.name}」`)
      setShowAddForm(false)
      setNewShift({ name: '', shortName: '', startTime: '09:00', endTime: '18:00', color: '#6366F1', icon: '📋' })
      loadShifts()
    } catch (err) {
      showToast('添加失败: ' + err.message, 'error')
    }
  }

  const handleDeleteShift = async (shift) => {
    if (shift.isDefault) {
      showToast('预置班次不能删除', 'warning')
      return
    }
    if (!window.confirm(`确定删除班次「${shift.name}」？\n使用该班次的排班记录将被置空。`)) return
    try {
      await deleteShift(shift.id)
      showToast(`已删除「${shift.name}」`)
      loadShifts()
    } catch (err) {
      showToast('删除失败: ' + err.message, 'error')
    }
  }

  const handleClearSchedules = async () => {
    if (!window.confirm('确定清除所有排班数据？人员、班次、备忘录不受影响。')) return
    try {
      const db = await getDB()

      const clearTx = db.transaction('scheduleRecords', 'readwrite')
      await clearTx.store.clear()
      await clearTx.done

      const clearWeekTx = db.transaction('schedules', 'readwrite')
      await clearWeekTx.store.clear()
      await clearWeekTx.done

      const clearCycleTx = db.transaction('cyclePatterns', 'readwrite')
      await clearCycleTx.store.clear()
      await clearCycleTx.done

      showToast('排班数据已清除')
    } catch (err) {
      showToast('清除失败: ' + err.message, 'error')
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-700">⚙️ 设置</h2>

      {/* 班次管理 */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-600">🏷️ 班次管理</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-xs text-primary-600 font-medium px-3 py-1 rounded-full bg-primary-50 active:bg-primary-100"
          >
            ＋ 添加班次
          </button>
        </div>

        {/* 添加班次表单 */}
        {showAddForm && (
          <div className="mb-4 p-3 rounded-xl bg-gray-50 space-y-3">
            <input
              type="text"
              placeholder="班次名称（如：早晚班）"
              value={newShift.name}
              onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
              autoFocus
            />
            <input
              type="text"
              placeholder="简称（如：早）"
              value={newShift.shortName}
              onChange={(e) => setNewShift({ ...newShift, shortName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-slate-400 block mb-1">开始时间</label>
                <input
                  type="time"
                  value={newShift.startTime}
                  onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-400 block mb-1">结束时间</label>
                <input
                  type="time"
                  value={newShift.endTime}
                  onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">颜色</label>
              <div className="flex gap-1.5 flex-wrap">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewShift({ ...newShift, color: c })}
                    className={`w-7 h-7 rounded-full transition-all ${
                      newShift.color === c ? 'ring-2 ring-primary-500 scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddShift}
                disabled={!newShift.name.trim()}
                className="flex-1 btn-primary text-sm py-2 text-center disabled:opacity-50"
              >
                保存班次
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="btn-secondary text-sm py-2"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full" />
          </div>
        ) : shifts.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">暂无班次</p>
        ) : (
          <div className="space-y-2">
            {shifts.map((shift) => (
              <div
                key={shift.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ backgroundColor: hexToRgba(shift.color) }}
              >
                <span className="text-xl">{shift.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700">
                    {shift.name}
                    {shift.shortName && <span className="text-xs text-slate-400 ml-1">({shift.shortName})</span>}
                  </p>
                  <p className="text-xs text-slate-400">
                    {shift.startTime ? `${shift.startTime} - ${shift.endTime}` : '全天'}
                    {shift.isDefault ? ' · 预置' : ' · 自定义'}
                  </p>
                </div>
                <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: shift.color }} />
                {!shift.isDefault && (
                  <button
                    onClick={() => handleDeleteShift(shift)}
                    className="text-xs text-red-400 hover:text-red-600 p-1 flex-shrink-0"
                  >
                    ✕
                  </button>
                )}
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
        <div className="flex flex-col gap-2">
          <button
            onClick={handleClearSchedules}
            className="w-full py-3 rounded-xl text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200 active:scale-95 transition-all text-center"
          >
            🗑️ 清除所有排班（保留人员、班次、备忘录）
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => showToast('数据导出（待实现）')}
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
                    }).catch((err) => {
                      showToast('重置失败: ' + err.message, 'error')
                    })
                  ).catch((err) => {
                    showToast('重置失败: ' + err.message, 'error')
                  })
                }
              }}
              className="flex-1 bg-red-50 text-red-500 border border-red-200 px-4 py-2 rounded-xl text-sm font-medium active:scale-95 transition-all text-center"
            >
              清除所有数据
            </button>
          </div>
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

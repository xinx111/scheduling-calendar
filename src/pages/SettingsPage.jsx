import { useState, useEffect } from 'react'
import { getAllShifts, addShift, deleteShift, updateShift } from '../db/shiftStore'
import { getDB, resetDB } from '../db/index'
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

  // 编辑班次状态
  const [editingShift, setEditingShift] = useState(null)

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

  const handleEditShift = (shift) => {
    setEditingShift({
      id: shift.id,
      name: shift.name,
      shortName: shift.shortName || '',
      startTime: shift.startTime || '09:00',
      endTime: shift.endTime || '18:00',
      color: shift.color || '#6366F1',
      icon: shift.icon || '📋',
    })
  }

  const handleSaveEdit = async () => {
    if (!editingShift.name.trim()) return
    try {
      await updateShift(editingShift.id, {
        name: editingShift.name.trim(),
        shortName: editingShift.shortName || editingShift.name.charAt(0),
        startTime: editingShift.startTime,
        endTime: editingShift.endTime,
        color: editingShift.color,
        icon: editingShift.icon,
      })
      showToast(`已更新「${editingShift.name.trim()}」`)
      setEditingShift(null)
      loadShifts()
    } catch (err) {
      showToast('更新失败: ' + err.message, 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">⚙️</span>
        <h2 className="text-lg font-bold text-slate-700">设置</h2>
      </div>

      {/* 班次管理 */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏷️</span>
            <h3 className="text-sm font-bold text-slate-700">班次管理</h3>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-xs font-semibold text-primary-600 px-3.5 py-1.5 rounded-full bg-primary-50 active:bg-primary-100 transition-colors"
          >
            ＋ 添加
          </button>
        </div>

        {/* 添加班次表单 */}
        {showAddForm && (
          <div className="mb-4 p-4 rounded-2xl bg-gray-50/80 space-y-3 border border-gray-100/60 animate-fade-in">
            <input type="text" placeholder="班次名称" value={newShift.name}
              onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
              className="input-field" autoFocus />
            <input type="text" placeholder="简称（选填）" value={newShift.shortName}
              onChange={(e) => setNewShift({ ...newShift, shortName: e.target.value })}
              className="input-field" />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-slate-400 block mb-1.5">开始</label>
                <input type="time" value={newShift.startTime}
                  onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                  className="input-field" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-400 block mb-1.5">结束</label>
                <input type="time" value={newShift.endTime}
                  onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                  className="input-field" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">颜色</label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((c) => (
                  <button key={c} onClick={() => setNewShift({ ...newShift, color: c })}
                    className={`w-8 h-8 rounded-xl transition-all ${newShift.color === c ? 'ring-2 ring-primary-500 ring-offset-2 scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleAddShift} disabled={!newShift.name.trim()}
                className="flex-1 btn-primary text-sm py-2.5 text-center disabled:opacity-50">保存</button>
              <button onClick={() => setShowAddForm(false)}
                className="btn-secondary text-sm py-2.5 flex-1 text-center">取消</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-6"><div className="spinner !w-6 !h-6" /></div>
        ) : shifts.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">暂无班次，点击上方添加</p>
        ) : (
          <div className="space-y-1.5">
            {shifts.map((shift) => (
              <div key={shift.id}
                onClick={() => handleEditShift(shift)}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-transparent hover:border-gray-100 active:scale-[0.99] transition-all cursor-pointer"
                style={{ backgroundColor: hexToRgba(shift.color) }}>
                <span className="text-lg">{shift.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700">
                    {shift.name}
                    {shift.shortName && <span className="text-xs text-slate-400 ml-1 font-normal">({shift.shortName})</span>}
                  </p>
                  <p className="text-xs text-slate-400">
                    {shift.startTime ? `${shift.startTime}–${shift.endTime}` : '全天'}
                    <span className="ml-1.5">{shift.isDefault ? '· 预置' : '· 自定义'}</span>
                  </p>
                </div>
                <span className="w-4 h-4 rounded-full flex-shrink-0 ring-1 ring-white/50" style={{ backgroundColor: shift.color }} />
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleEditShift(shift)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-xs text-primary-400 hover:bg-primary-50 transition-colors flex-shrink-0">✎</button>
                  <button onClick={() => handleDeleteShift(shift)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-xs text-rose-400 hover:bg-rose-50 transition-colors flex-shrink-0">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 数据管理 */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">💾</span>
          <h3 className="text-sm font-bold text-slate-700">数据管理</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">数据存储在手机本地，清除缓存会消失。</p>
        <div className="flex flex-col gap-2.5">
          <button onClick={handleClearSchedules}
            className="w-full py-3 rounded-2xl text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200/60 active:scale-[0.98] transition-all shadow-sm">
            🗑️ 清除排班数据（保留人员/班次/备忘录）
          </button>
          <div className="flex gap-2.5">
            <button onClick={() => showToast('数据导出（待实现）')}
              className="flex-1 py-3 rounded-2xl text-sm font-medium border border-gray-200 text-slate-500 bg-white active:scale-[0.98] transition-all">导出数据</button>
            <button onClick={() => {
                if (window.confirm('确定清除所有数据？此操作不可恢复！'))
                  resetDB().then(() => { showToast('已重置'); window.location.reload() }).catch((e) => showToast('失败: ' + e.message, 'error'))
              }}
              className="flex-1 py-3 rounded-2xl text-sm font-medium bg-rose-50 text-rose-600 border border-rose-200/60 active:scale-[0.98] transition-all">清除全部</button>
          </div>
        </div>
      </div>

      {/* 关于 */}
      <div className="card text-center py-5">
        <span className="text-2xl mb-2 block">📅</span>
        <h3 className="text-sm font-bold text-slate-700">排班日历</h3>
        <p className="text-xs text-slate-400 mt-0.5">v1.0.0 · 简洁 · 高效</p>
      </div>

      {/* 编辑班次弹窗 */}
      {editingShift && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setEditingShift(null)}>
          <div className="absolute bottom-14 left-0 right-0 bg-white rounded-t-3xl shadow-2xl flex flex-col animate-slide-up max-h-[65vh]"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-300/60" />
            </div>
            <div className="flex-shrink-0 border-b border-gray-100 px-5 py-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-700">✏️ 编辑班次</h3>
                <button onClick={() => setEditingShift(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-slate-400 transition-colors">✕</button>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">班次名称</label>
                <input type="text" value={editingShift.name}
                  onChange={(e) => setEditingShift({ ...editingShift, name: e.target.value })}
                  className="input-field" autoFocus />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">简称</label>
                <input type="text" value={editingShift.shortName}
                  onChange={(e) => setEditingShift({ ...editingShift, shortName: e.target.value })}
                  className="input-field" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-slate-400 block mb-1.5">开始</label>
                  <input type="time" value={editingShift.startTime}
                    onChange={(e) => setEditingShift({ ...editingShift, startTime: e.target.value })}
                    className="input-field" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-400 block mb-1.5">结束</label>
                  <input type="time" value={editingShift.endTime}
                    onChange={(e) => setEditingShift({ ...editingShift, endTime: e.target.value })}
                    className="input-field" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">颜色</label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map((c) => (
                    <button key={c} onClick={() => setEditingShift({ ...editingShift, color: c })}
                      className={`w-8 h-8 rounded-xl transition-all ${editingShift.color === c ? 'ring-2 ring-primary-500 ring-offset-2 scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 border-t border-gray-100 px-5 py-4">
              <div className="flex gap-3">
                <button onClick={handleSaveEdit} disabled={!editingShift.name.trim()}
                  className="flex-1 btn-primary text-sm py-3 text-center disabled:opacity-50 shadow-lg shadow-primary-200/30">✓ 保存修改</button>
                <button onClick={() => setEditingShift(null)}
                  className="btn-secondary text-sm py-3 flex-1 text-center">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
